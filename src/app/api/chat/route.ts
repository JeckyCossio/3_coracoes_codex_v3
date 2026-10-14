import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { classifyWithOpenRouter, summarizeHandoff } from "@/lib/ai";
import { newConversation, processar } from "@/lib/conversation";
import { createSession, getSession, saveCase, saveSession, sweepExpired } from "@/lib/db";
import { MODELOS, type Modelo } from "@/lib/fichas";
import { answerWithManual } from "@/lib/rag";
import { readSignedSession, signSession } from "@/lib/signed-session";

export const runtime = "nodejs";

async function conversationForModel(id: string, model: Modelo) {
  const state = await processar(newConversation(id), `model:${model}`);
  state.messages.shift();
  return state;
}

export async function POST(request: Request) {
  let body: { sessionId?: unknown; sessionToken?: unknown; model?: unknown; input?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Envie um JSON válido." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      (body.input != null && (typeof body.input !== "string" || body.input.length > 800))) {
    return NextResponse.json({ error: "Dados da conversa inválidos." }, { status: 400 });
  }
  try {
    const modelParam = typeof body.model === "string" ? body.model.toLowerCase() : "";
    const requestedModel = modelParam
      ? MODELOS.find((model) => model.toLowerCase() === modelParam)
      : undefined;
    if (process.env.CHAT_STORAGE === "signed") {
      const previous = readSignedSession(body.sessionToken);
      let state = body.input === "restart" ? newConversation(randomUUID()) : previous || newConversation(randomUUID());
      if (!body.input && requestedModel && state.model !== requestedModel) {
        state = await conversationForModel(randomUUID(), requestedModel);
      } else if (typeof body.input === "string" && body.input !== "restart" && previous) {
        state = await processar(state, body.input, classifyWithOpenRouter, answerWithManual);
      }
      return NextResponse.json({ sessionId: state.id, sessionToken: signSession(state), state, demoMode: true });
    }
    sweepExpired();
    const id = typeof body.sessionId === "string" && /^[a-f0-9-]{36}$/i.test(body.sessionId) ? body.sessionId : randomUUID();
    if (body.input === "restart") {
      const freshId = randomUUID();
      return NextResponse.json({ sessionId: freshId, state: createSession(freshId) });
    }
    const old = getSession(id);
    if (!body.input && requestedModel && old?.model !== requestedModel) {
      const freshId = old ? randomUUID() : id;
      const selected = await conversationForModel(freshId, requestedModel);
      saveSession(selected);
      return NextResponse.json({ sessionId: freshId, state: selected });
    }
    const state = old || createSession(id);
    if (!body.input || !old) return NextResponse.json({ sessionId: id, state });
    const next = await processar(state, body.input, classifyWithOpenRouter, answerWithManual);
    if (next.outcome === "transferido_pendente" && state.outcome !== "transferido_pendente") {
      try {
        const summary = await summarizeHandoff(next);
        if (summary) {
          next.handoffSummary = summary.text;
          next.aiCalls++;
          next.inputTokens += summary.inputTokens;
          next.outputTokens += summary.outputTokens;
        }
      } catch { /* Deterministic report is always available. */ }
    }
    saveSession(next);
    saveCase(next);
    return NextResponse.json({ sessionId: id, state: next });
  } catch {
    console.error("chat request failed");
    return NextResponse.json({ error: "Não foi possível continuar a conversa." }, { status: 500 });
  }
}
