import assert from "node:assert/strict";

const base = process.env.BASE_URL || "http://localhost:3000";
const password = process.env.PANEL_PASSWORD;
if (!password) throw new Error("Defina PANEL_PASSWORD com a senha da instância de teste.");
const authorization = `Basic ${Buffer.from(`tester:${password}`).toString("base64")}`;

async function post(path, payload, internal = false) {
  const response = await fetch(new URL(path, base), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(internal ? { Authorization: authorization } : {}) },
    body: typeof payload === "string" ? payload : JSON.stringify(payload)
  });
  return { status: response.status, body: await response.json() };
}

async function get(path, internal = false) {
  const response = await fetch(new URL(path, base), {
    headers: internal ? { Authorization: authorization } : {}
  });
  return { status: response.status, body: path.startsWith("/api/") && response.ok ? await response.json() : null };
}

assert.equal((await post("/api/chat", "{" )).status, 400);
assert.equal((await post("/api/chat", null)).status, 400);
assert.equal((await post("/api/chat", { input: { text: "x" } })).status, 400);
assert.equal((await post("/api/chat", { input: "x".repeat(801) })).status, 400);
for (const path of ["/dashboard", "/atendente", "/api/painel/stats", "/api/painel/handoffs"]) {
  assert.equal((await get(path)).status, 401, `${path} deve exigir senha`);
  assert.equal((await get(path, true)).status, 200, `${path} deve abrir com senha`);
}
assert.equal((await post("/api/painel/handoffs", "{", true)).status, 400);
assert.equal((await post("/api/painel/handoffs", { id: "ruim" }, true)).status, 400);

async function journey(inputs) {
  let sessionId;
  let state;
  for (const input of [undefined, ...inputs]) {
    const result = await post("/api/chat", { sessionId, input });
    assert.equal(result.status, 200);
    sessionId = result.body.sessionId;
    state = result.body.state;
    assert.equal(state.id, sessionId);
  }
  return { sessionId, state };
}

const resolved = await journey(["model:LOV", "topic:problem", "issue:other", "alavanca não fecha com cápsula", "decision:yes", "step:done", "resolved:yes", "rating:5"]);
assert.equal(resolved.state.stage, "encerrado");
assert.equal(resolved.state.outcome, "resolvido_autodeclarado");
assert.equal(resolved.state.rating, 5);

const handoff = await journey(["model:Touch", "topic:problem", "issue:10", "decision:no"]);
assert.equal(handoff.state.stage, "transferido");
assert.equal(handoff.state.handoffReason, "instrucao_sem_validacao_por_modelo");
const repeat = await post("/api/chat", { sessionId: handoff.sessionId, input: "step:done" });
assert.equal(repeat.body.state.stage, "transferido");
assert.equal(repeat.body.state.messages.length, 1, "o histórico temporário deve ser apagado ao encerrar");

const unsafe = await journey(["model:Luna", "água perto do cabo"]);
assert.equal(unsafe.state.handoffReason, "sinal_de_risco");

const handoffs = (await get("/api/painel/handoffs", true)).body.items;
assert.equal(handoffs.filter((item) => item.id === handoff.sessionId).length, 1);
assert.equal(handoffs.find((item) => item.id === handoff.sessionId).report.ficha, 10);
assert.equal((await post("/api/painel/handoffs", { id: handoff.sessionId }, true)).body.updated, true);
assert.equal((await post("/api/painel/handoffs", { id: handoff.sessionId }, true)).body.updated, false);

const stats = (await get("/api/painel/stats", true)).body;
assert.ok(stats.resolved >= 1 && stats.transferred >= 2);
assert.equal(stats.simulated, true);
console.log("Smoke API OK: validação, autenticação, resolução, risco, transferência, fila e métricas.");
