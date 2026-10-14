import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { basename, join } from "node:path";
import { handoffReport, newConversation, type Conversation } from "./conversation";

let instance: Database.Database | undefined;

export function db() {
  if (instance) return instance;
  const path = join(process.cwd(), "data", basename(process.env.SQLITE_PATH || "chatbot.sqlite"));
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  instance = new Database(path);
  instance.pragma("journal_mode = WAL");
  instance.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY, state_json TEXT NOT NULL, updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY, started_at INTEGER NOT NULL, finished_at INTEGER NOT NULL,
      model TEXT, entry TEXT, issue_id INTEGER, outcome TEXT NOT NULL,
      handoff_reason TEXT, steps_shown INTEGER NOT NULL, steps_failed INTEGER NOT NULL,
      abandoned_at_step INTEGER,
      rating INTEGER, ai_calls INTEGER NOT NULL, input_tokens INTEGER NOT NULL,
      output_tokens INTEGER NOT NULL, simulated INTEGER NOT NULL DEFAULT 1,
      duration_s INTEGER, layer_final TEXT
    );
    CREATE TABLE IF NOT EXISTS handoffs (
      id TEXT PRIMARY KEY, case_id TEXT NOT NULL, status TEXT NOT NULL,
      report_json TEXT NOT NULL, created_at INTEGER NOT NULL, attended_at INTEGER
    );
  `);
  const columns = instance.prepare("PRAGMA table_info(cases)").all() as { name: string }[];
  if (!columns.some((c) => c.name === "abandoned_at_step")) instance.exec("ALTER TABLE cases ADD COLUMN abandoned_at_step INTEGER");
  if (!columns.some((c) => c.name === "duration_s")) instance.exec("ALTER TABLE cases ADD COLUMN duration_s INTEGER");
  if (!columns.some((c) => c.name === "layer_final")) instance.exec("ALTER TABLE cases ADD COLUMN layer_final TEXT");
  return instance;
}

export function getSession(id: string): Conversation | null {
  const row = db().prepare("SELECT state_json FROM sessions WHERE id = ?").get(id) as { state_json: string } | undefined;
  return row ? JSON.parse(row.state_json) as Conversation : null;
}

export function saveSession(state: Conversation) {
  const temporaryMessages = state.stage === "encerrado" || state.stage === "transferido"
    ? state.messages.slice(-1) : state.messages;
  const stored = {
    ...state,
    messages: temporaryMessages.map((message) => message.ephemeral
      ? { text: "Resposta do manual exibida durante a conversa.", source: message.source }
      : message)
  };
  db().prepare("INSERT INTO sessions (id, state_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET state_json=excluded.state_json, updated_at=excluded.updated_at")
    .run(state.id, JSON.stringify(stored), state.updatedAt);
}

export function saveCase(state: Conversation) {
  if (!state.outcome) return;
  const layer = state.outcome === "transferido_pendente" ? "humano" : state.manualAnswerUsed ? "ia_manual" : "ficha_guiada";
  const durationSeconds = Math.max(0, Math.round((state.updatedAt - state.startedAt) / 1000));
  db().prepare(`INSERT INTO cases (id, started_at, finished_at, model, entry, issue_id, outcome,
    handoff_reason, steps_shown, steps_failed, abandoned_at_step, rating, ai_calls, input_tokens, output_tokens,
    duration_s, layer_final)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET finished_at=excluded.finished_at, outcome=excluded.outcome,
    handoff_reason=excluded.handoff_reason, abandoned_at_step=excluded.abandoned_at_step, rating=excluded.rating,
    ai_calls=excluded.ai_calls, input_tokens=excluded.input_tokens, output_tokens=excluded.output_tokens,
    duration_s=excluded.duration_s, layer_final=excluded.layer_final`)
    .run(state.id, state.startedAt, state.updatedAt, state.model || null, state.entry || null,
      state.issueId || null, state.outcome, state.handoffReason || null, state.stepsShown.length,
      state.stepsFailed.length, state.outcome === "abandonou" ? state.step + 1 : null,
      state.rating || null, state.aiCalls, state.inputTokens, state.outputTokens, durationSeconds, layer);
  if (state.outcome === "transferido_pendente") {
    db().prepare(`INSERT OR IGNORE INTO handoffs (id, case_id, status, report_json, created_at)
      VALUES (?, ?, 'aguardando', ?, ?)`)
      .run(state.id, state.id, JSON.stringify(handoffReport(state)), state.updatedAt);
  }
}

export function sweepExpired(now = Date.now()) {
  const rows = db().prepare("SELECT state_json FROM sessions WHERE updated_at < ?").all(now - 10 * 60_000) as { state_json: string }[];
  for (const row of rows) {
    const state = JSON.parse(row.state_json) as Conversation;
    if (state.outcome || state.stage === "encerrado" || state.stage === "transferido") continue;
    state.outcome = "abandonou";
    state.stage = "encerrado";
    state.updatedAt = now;
    state.messages = [{ text: "A conversa foi encerrada por inatividade. Você pode começar novamente.", options: [{ id: "restart", label: "Começar outra conversa" }] }];
    saveSession(state);
    saveCase(state);
  }
}

export function createSession(id: string): Conversation {
  const state = newConversation(id);
  saveSession(state);
  return state;
}

export type HandoffRow = { id: string; status: string; report_json: string; created_at: number; attended_at: number | null };

export function getHandoffs() {
  return db().prepare("SELECT id, status, report_json, created_at, attended_at FROM handoffs ORDER BY created_at ASC").all() as HandoffRow[];
}

export function markAttended(id: string) {
  return db().prepare("UPDATE handoffs SET status = 'atendido', attended_at = ? WHERE id = ? AND status = 'aguardando'").run(Date.now(), id).changes > 0;
}

export function getStats() {
  const rows = db().prepare("SELECT * FROM cases").all() as Array<Record<string, unknown>>;
  const count = (f: (r: Record<string, unknown>) => boolean) => rows.filter(f).length;
  const resolved = count((r) => r.outcome === "resolvido_autodeclarado");
  const transferred = count((r) => r.outcome === "transferido_pendente");
  const abandoned = count((r) => r.outcome === "abandonou");
  const byModel: Record<string, number> = {};
  const byIssue: Record<string, number> = {};
  const byModelIssue: Record<string, Record<string, number>> = {};
  const byLayer: Record<string, number> = {};
  const abandonedByStep: Record<string, number> = {};
  const abandonedByIssueStep: Record<string, number> = {};
  const dailyHandoffs: Record<string, number> = {};
  for (const row of rows) {
    const model = String(row.model || "Não informado");
    byModel[model] = (byModel[model] || 0) + 1;
    const issue = row.issue_id ? `Ficha ${row.issue_id}` : String(row.entry || "Sem classificação");
    byIssue[issue] = (byIssue[issue] || 0) + 1;
    byModelIssue[model] ||= {};
    byModelIssue[model][issue] = (byModelIssue[model][issue] || 0) + 1;
    const layer = String(row.layer_final || (row.outcome === "transferido_pendente" ? "humano" : row.entry === "duvida" ? "ia_manual" : "ficha_guiada"));
    byLayer[layer] = (byLayer[layer] || 0) + 1;
    if (row.outcome === "abandonou") {
      const step = row.abandoned_at_step ? `Passo ${row.abandoned_at_step}` : "Antes dos passos";
      abandonedByStep[step] = (abandonedByStep[step] || 0) + 1;
      const issueStep = `${issue} · ${step}`;
      abandonedByIssueStep[issueStep] = (abandonedByIssueStep[issueStep] || 0) + 1;
    }
    if (row.outcome === "transferido_pendente") {
      const day = new Date(Number(row.finished_at)).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
      dailyHandoffs[day] = (dailyHandoffs[day] || 0) + 1;
    }
  }
  const ratings = rows.map((r) => Number(r.rating)).filter((n) => n >= 1 && n <= 5);
  const inputTokens = rows.reduce((n, r) => n + Number(r.input_tokens || 0), 0);
  const outputTokens = rows.reduce((n, r) => n + Number(r.output_tokens || 0), 0);
  const estimatedCostUsd = (inputTokens * Number(process.env.LLM_INPUT_USD_PER_M || 0) + outputTokens * Number(process.env.LLM_OUTPUT_USD_PER_M || 0)) / 1_000_000;
  const durations = rows.filter((row) => row.duration_s != null).map((row) => Number(row.duration_s)).filter((value) => Number.isFinite(value) && value >= 0);
  return {
    total: rows.length, resolved, transferred, abandoned,
    resolutionRate: resolved + transferred ? resolved / (resolved + transferred) : 0,
    handoffRate: rows.length ? transferred / rows.length : 0,
    averageRating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
    aiCalls: rows.reduce((n, r) => n + Number(r.ai_calls || 0), 0),
    inputTokens, outputTokens, estimatedCostUsd,
    costPerSelfResolutionUsd: resolved ? estimatedCostUsd / resolved : null,
    averageDurationSeconds: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null,
    byModel, byIssue, byModelIssue, byLayer, abandonedByStep, abandonedByIssueStep,
    dailyHandoffs: Object.fromEntries(Object.entries(dailyHandoffs).sort(([a], [b]) => a.localeCompare(b))),
    simulated: rows.some((r) => r.simulated === 1)
  };
}
