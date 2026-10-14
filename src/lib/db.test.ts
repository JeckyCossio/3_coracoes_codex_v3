import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { newConversation, processar } from "./conversation";
import { createSession, db, getHandoffs, getSession, getStats, markAttended, saveCase, saveSession, sweepExpired } from "./db";

const filename = `chatbot-test-${randomUUID()}.sqlite`;
const path = join(process.cwd(), "data", filename);

beforeAll(() => { process.env.SQLITE_PATH = filename; });
afterAll(() => {
  db().close();
  for (const suffix of ["", "-wal", "-shm"]) rmSync(path + suffix, { force: true });
  delete process.env.SQLITE_PATH;
});

describe("persistência do protótipo", () => {
  it("registra transferência uma só vez e permite marcar atendimento", async () => {
    const id = randomUUID();
    let s = createSession(id);
    s = await processar(s, "model:LOV");
    s = await processar(s, "quero uma pessoa");
    saveSession(s); saveCase(s); saveCase(s);
    expect(getSession(id)?.messages).toHaveLength(1);
    expect(getHandoffs().filter((item) => item.id === id)).toHaveLength(1);
    expect(getStats().transferred).toBe(1);
    expect(getStats().byLayer.humano).toBe(1);
    expect(markAttended(id)).toBe(true);
    expect(markAttended(id)).toBe(false);
  });

  it("não guarda o texto dinâmico do manual na sessão", () => {
    const s = newConversation(randomUUID());
    s.messages.push({ text: "Resposta privada temporária", source: "Manual LOV · p. 4", ephemeral: true });
    saveSession(s);
    const stored = getSession(s.id);
    expect(JSON.stringify(stored)).not.toContain("Resposta privada temporária");
    expect(stored?.messages.at(-1)?.source).toContain("Manual LOV");
  });

  it("encerra como abandono uma sessão inativa e preserva casos já concluídos", async () => {
    const now = Date.now();
    const abandoned = newConversation(randomUUID(), now - 11 * 60_000);
    abandoned.model = "LOV";
    abandoned.issueId = 6;
    abandoned.step = 1;
    saveSession(abandoned);
    const finished = newConversation(randomUUID(), now - 11 * 60_000);
    finished.stage = "transferido";
    finished.outcome = "transferido_pendente";
    saveSession(finished); saveCase(finished);
    sweepExpired(now);
    expect(getSession(abandoned.id)?.outcome).toBe("abandonou");
    expect(getSession(finished.id)?.outcome).toBe("transferido_pendente");
    expect(getStats().abandoned).toBe(1);
    expect(getStats().abandonedByIssueStep["Ficha 6 · Passo 2"]).toBe(1);
    sweepExpired(now + 1000);
    expect(getStats().abandoned).toBe(1);
  });

  it("registra duração, camada e problema por modelo sem texto livre", () => {
    const state = newConversation(randomUUID(), 1_000);
    state.model = "Touch";
    state.entry = "duvida";
    state.manualAnswerUsed = true;
    state.outcome = "resolvido_autodeclarado";
    state.stage = "encerrado";
    state.updatedAt = 31_000;
    state.rating = 4;
    saveSession(state); saveCase(state);
    const row = db().prepare("SELECT duration_s, layer_final, rating FROM cases WHERE id = ?").get(state.id) as { duration_s: number; layer_final: string; rating: number };
    expect(row).toEqual({ duration_s: 30, layer_final: "ia_manual", rating: 4 });
    const stats = getStats();
    expect(stats.byModelIssue.Touch.duvida).toBe(1);
    expect(stats.byLayer.ia_manual).toBe(1);
    expect(stats.dailyHandoffs).toBeDefined();
  });
});
