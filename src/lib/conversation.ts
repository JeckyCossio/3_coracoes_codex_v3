import { FICHA_POR_ID, FICHAS, identificarFicha, MODELOS, normalizar, PRINCIPAIS, type Modelo } from "./fichas";
import { videoFor } from "./videos";

export type Stage = "modelo" | "menu" | "problema" | "descrever" | "esclarecer" | "guia" | "confirmar" | "duvida" | "avaliar" | "encerrado" | "transferido";
export type Outcome = "resolvido_autodeclarado" | "transferido_pendente" | "abandonou";
export type Option = { id: string; label: string };
export type BotMessage = { text: string; options?: Option[]; source?: string; tone?: "normal" | "alert" | "success"; ephemeral?: boolean };
export type Conversation = {
  id: string;
  stage: Stage;
  model?: Modelo;
  entry?: string;
  issueId?: number;
  step: number;
  failures: number;
  misunderstandings: number;
  clarificationAsked: boolean;
  awaitingStepQuestion?: boolean;
  stepsShown: number[];
  stepsFailed: number[];
  messages: BotMessage[];
  outcome?: Outcome;
  handoffReason?: string;
  handoffSummary?: string;
  manualAnswerUsed?: boolean;
  pendingQuestion?: string;
  questionAttempts?: number;
  rating?: number;
  startedAt: number;
  updatedAt: number;
  aiCalls: number;
  inputTokens: number;
  outputTokens: number;
};

const op = (id: string, label: string): Option => ({ id, label });
const menu: Option[] = [op("topic:problem", "Problema na máquina"), op("topic:question", "Dúvida sobre a máquina")];
const problemOptions = [
  ...PRINCIPAIS.map((id) => op(`issue:${id}`, FICHA_POR_ID.get(id)!.titulo)),
  op("issue:other", "Outro problema")
];
const humanPattern = /\b(atendente|pessoa|humano|humana|suporte humano|falar com alguem|falar com alguém)\b/i;
const riskPattern = /\b(choque|faisca|fumaca|queimad[oa]|curto.?circuito|(agua|vazamento|molhad[oa]).{0,30}(tomada|cabo|fio|parte eletrica)|(tomada|cabo|fio|parte eletrica).{0,30}(agua|vazamento|molhad[oa]))\b/i;
const questionStart = /^(qual|quais|como|o que|oque|por que|porque|para que|pra que|onde|quando|existe|tem como|pode me explicar|me explica|explique|gostaria de saber|queria saber|diferença|diferenca)\b/;

function isQuestion(text: string) {
  if (/^(model|topic|issue|step|decision|resolved|rating|question|support):/.test(text)) return false;
  const normalized = normalizar(text);
  return normalized.includes("?") || questionStart.test(normalized);
}

function send(s: Conversation, message: BotMessage) { s.messages.push(message); }

export function newConversation(id: string, now = Date.now()): Conversation {
  return {
    id, stage: "modelo", step: 0, failures: 0, misunderstandings: 0,
    clarificationAsked: false, awaitingStepQuestion: false, stepsShown: [], stepsFailed: [],
    messages: [{ text: "Olá! Vamos encontrar a orientação para sua máquina. Qual é o modelo?", options: [...MODELOS.map((m) => op(`model:${m}`, m)), op("model:other", "Outra máquina")] }],
    startedAt: now, updatedAt: now, aiCalls: 0, inputTokens: 0, outputTokens: 0
  };
}

function transfer(s: Conversation, reason: string) {
  s.stage = "transferido";
  s.outcome = "transferido_pendente";
  s.handoffReason = reason;
  const text = reason === "sinal_de_risco" || reason === "vazamento_proximo_parte_eletrica"
    ? "Por segurança, interrompa o uso da máquina. Para receber ajuda, acesse a Central de Ajuda TRES: https://www.escolhatres.com.br/central-de-ajuda/"
    : "Para continuar com um atendente, acesse a Central de Ajuda TRES: https://www.escolhatres.com.br/central-de-ajuda/";
  send(s, { text, tone: "alert", options: [op("restart", "Começar outra conversa")] });
}

function repeatChoice(s: Conversation, message: string, options: Option[]) {
  s.misunderstandings = Math.min(s.misunderstandings + 1, 3);
  send(s, { text: s.misunderstandings >= 2 ? "Ainda não entendi. Você pode escolher uma opção ou escrever sua dúvida com outras palavras." : message, options });
}

function isDecisionStep(id: number, step: number) {
  return (id === 2 && step === 1) || (step === 0 && [3, 7, 10, 11, 12, 13].includes(id));
}

function showStep(s: Conversation) {
  s.awaitingStepQuestion = false;
  const ficha = FICHA_POR_ID.get(s.issueId!);
  if (!ficha) return transfer(s, "ficha_indisponivel");
  const passo = ficha.passos[s.step];
  if (!passo) {
    s.stage = "confirmar";
    return send(s, { text: "O problema foi solucionado?", options: [op("resolved:yes", "Sim, resolveu"), op("resolved:no", "Não resolveu")] });
  }
  if (passo.bloqueado) {
    send(s, { text: "Essa etapa exige uma orientação específica para o seu modelo.", tone: "alert" });
    return transfer(s, "instrucao_sem_validacao_por_modelo");
  }
  if (!s.stepsShown.includes(s.step)) s.stepsShown.push(s.step);
  s.stage = "guia";
  const video = videoFor(ficha.id, s.model);
  const isDecision = isDecisionStep(ficha.id, s.step);
  let decisionOptions: Option[] = [];
  if (isDecision) {
    if (ficha.id === 2) decisionOptions = [op("decision:yes", "Sim, continua aceso"), op("decision:no", "Não, apagou")];
    if (ficha.id === 3) decisionOptions = [op("decision:yes", "Sim, tem água"), op("decision:no", "Não tem água")];
    if (ficha.id === 7) decisionOptions = [op("decision:yes", "Sim, corresponde"), op("decision:no", "Não corresponde")];
    if (ficha.id === 10) decisionOptions = [op("decision:yes", "Sim, perto da parte elétrica"), op("decision:no", "Não, está longe")];
    if (ficha.id === 11) decisionOptions = [op("decision:yes", "Sim, está encaixado e com água"), op("decision:no", "Não está")];
    if (ficha.id === 12) decisionOptions = [op("decision:yes", "Sim, saiu na bandeja"), op("decision:no", "Não saiu")];
    if (ficha.id === 13) decisionOptions = [op("decision:yes", "Sim, está cheio"), op("decision:no", "Não está cheio")];
  }
  send(s, { text: passo.texto, source: `Fluxo CS, ficha ${ficha.id}, p. ${ficha.pagina}`, options: isDecision ? decisionOptions : [op("step:done", "Feito"), op("step:failed", "Não consegui"), op("step:help", "Não entendi o passo"), ...(video ? [op("step:video", "Ver vídeo")] : [])] });
}

function startFicha(s: Conversation, id: number) {
  const ficha = FICHA_POR_ID.get(id);
  if (!ficha) return transfer(s, "ficha_indisponivel");
  s.issueId = id; s.step = 0; s.failures = 0; s.stepsShown = []; s.stepsFailed = [];
  send(s, { text: `Entendi. Vamos verificar: ${ficha.titulo}.` });
  showStep(s);
}

function reset(s: Conversation, now: number): Conversation {
  return newConversation(s.id, now);
}

export type Classifier = (text: string) => Promise<{ id: number | null; inputTokens?: number; outputTokens?: number }>;
export type Answerer = (model: Modelo, question: string, context?: string) => Promise<{ text: string; source: string; inputTokens?: number; outputTokens?: number } | null>;

async function answerQuestion(s: Conversation, question: string, answer?: Answerer) {
  s.stage = "duvida";
  s.entry = "duvida";
  if (answer && s.model) {
    try {
      const result = await answer(s.model, question);
      if (result) {
        s.aiCalls++;
        s.inputTokens += result.inputTokens || 0;
        s.outputTokens += result.outputTokens || 0;
        s.manualAnswerUsed = true;
        s.questionAttempts = 0;
        send(s, { text: result.text, source: result.source, ephemeral: true });
        send(s, { text: "Posso ajudar com mais alguma coisa?", options: [op("question:another", "Outra dúvida"), op("topic:problem", "Resolver um problema")] });
        return;
      }
    } catch { /* Ask for detail when retrieval is unavailable. */ }
  }
  s.questionAttempts = (s.questionAttempts || 0) + 1;
  if (s.questionAttempts === 1) {
    const aboutButtons = /\b(botao|botoes|tecla|teclas)\b/.test(normalizar(question));
    send(s, { text: aboutButtons
      ? "Você quer saber a função dos botões de bebida ou o significado de alguma luz? Se puder, diga a cor do botão."
      : "Pode me dar mais detalhes sobre sua dúvida? Diga o que você quer saber e o modelo da máquina, se ainda não informou." });
    return;
  }
  send(s, { text: "Ainda não encontrei informação suficiente para responder com segurança. Você pode perguntar de outra forma, consultar os guias da sua máquina ou procurar a Central de Ajuda TRES.", options: [op("question:another", "Fazer outra pergunta"), op("topic:problem", "Resolver um problema"), op("support:human", "Central de Ajuda")] });
}

export async function processar(base: Conversation, input: string, classify?: Classifier, answer?: Answerer, now = Date.now()): Promise<Conversation> {
  let s: Conversation = structuredClone(base);
  const text = input.trim().slice(0, 800);
  if (text === "restart") return reset(s, now);
  if (["encerrado", "transferido"].includes(s.stage)) return s;
  s.updatedAt = now;

  if (humanPattern.test(text) && !text.startsWith("model:")) { transfer(s, "pedido_expresso"); return s; }
  if (riskPattern.test(normalizar(text))) { transfer(s, "sinal_de_risco"); return s; }
  if (text === "support:human") { transfer(s, "pedido_expresso"); return s; }
  if (s.messages.at(-1)?.options?.some((option) => option.id === text)) s.misunderstandings = 0;

  if (s.stage === "modelo" && isQuestion(text)) {
    s.pendingQuestion = text;
    send(s, { text: "Qual é o modelo da sua máquina? Assim consigo responder com mais precisão.", options: [...MODELOS.map((m) => op(`model:${m}`, m)), op("model:other", "Outra máquina")] });
    return s;
  }
  if (s.model && ["menu", "problema", "descrever", "esclarecer"].includes(s.stage) && isQuestion(text)) {
    await answerQuestion(s, text, answer);
    return s;
  }

  if (s.stage === "modelo") {
    if (text === "model:other") {
      send(s, { text: "Por enquanto, só consigo orientar os modelos LOV, Modo, Passione, Luna e Touch.", tone: "alert" });
      transfer(s, "modelo_fora_do_escopo"); return s;
    }
    const model = text.replace(/^model:/, "") as Modelo;
    if (!MODELOS.includes(model)) { repeatChoice(s, "Ajudo apenas com máquinas TRES. Escolha um dos modelos mostrados.", [...MODELOS.map((m) => op(`model:${m}`, m)), op("model:other", "Outra máquina")]); return s; }
    s.misunderstandings = 0;
    s.model = model; s.stage = "menu";
    if (s.pendingQuestion) {
      const pending = s.pendingQuestion;
      delete s.pendingQuestion;
      await answerQuestion(s, pending, answer);
      return s;
    }
    send(s, { text: `Certo, ${model}. O que está acontecendo?`, options: menu }); return s;
  }

  if (s.stage === "menu") {
    if (text === "topic:problem") { s.stage = "problema"; send(s, { text: "Qual destes problemas parece com o seu?", options: problemOptions }); return s; }
    if (text === "topic:question") { s.entry = "duvida"; s.stage = "duvida"; send(s, { text: "Escreva sua dúvida sobre a máquina. Vou procurar uma resposta no manual do modelo escolhido." }); return s; }
    repeatChoice(s, "Ajudo apenas com máquinas TRES. Escolha uma das opções para continuar.", menu); return s;
  }

  if (s.stage === "problema") {
    if (text === "issue:other") { s.entry = "outro_problema"; s.stage = "descrever"; send(s, { text: "Conte em poucas palavras o que acontece com a máquina." }); return s; }
    const id = Number(text.replace(/^issue:/, ""));
    if (!PRINCIPAIS.includes(id as (typeof PRINCIPAIS)[number])) { repeatChoice(s, "Escolha um problema da lista ou 'Outro problema'.", problemOptions); return s; }
    s.entry = `botao_${id}`; startFicha(s, id); return s;
  }

  if (s.stage === "descrever" || s.stage === "esclarecer") {
    if (!text) { send(s, { text: "Descreva o sinal que você vê ou o que a máquina deixa de fazer." }); return s; }
    let ficha = identificarFicha(text);
    if (!ficha && classify && process.env.ENABLE_EXTERNAL_AI === "1") {
      try {
        const result = await classify(text);
        s.aiCalls += 1; s.inputTokens += result.inputTokens || 0; s.outputTokens += result.outputTokens || 0;
        ficha = result.id ? FICHA_POR_ID.get(result.id) || null : null;
      } catch { /* Continue with an explicit fallback. */ }
    }
    if (ficha) { startFicha(s, ficha.id); return s; }
    if (!s.clarificationAsked) { s.clarificationAsked = true; s.stage = "esclarecer"; send(s, { text: "Pode contar um pouco mais? Em que momento isso acontece e aparece alguma luz ou mensagem na máquina?" }); return s; }
    if (answer && s.model) {
      try {
        const result = await answer(s.model, text);
        if (result) {
          s.aiCalls++; s.inputTokens += result.inputTokens || 0; s.outputTokens += result.outputTokens || 0;
          s.manualAnswerUsed = true;
          s.stage = "duvida";
          send(s, { text: result.text, source: result.source, ephemeral: true });
          send(s, { text: "Posso ajudar com mais alguma coisa?", options: [op("question:another", "Outra dúvida"), op("topic:problem", "Resolver um problema")] });
          return s;
        }
      } catch { /* Safe handoff below. */ }
    }
    send(s, { text: "Ainda não consegui identificar o que está acontecendo. Você pode descrever de outra forma ou consultar a Central de Ajuda TRES.", options: [op("support:human", "Central de Ajuda"), op("question:another", "Fazer outra pergunta")] });
    s.stage = "duvida"; return s;
  }

  if (s.stage === "guia") {
    const ficha = FICHA_POR_ID.get(s.issueId!);
    if (isQuestion(text) && !s.awaitingStepQuestion) s.awaitingStepQuestion = true;
    if (ficha && isDecisionStep(ficha.id, s.step) && ["decision:yes", "decision:no"].includes(text)) {
      const yes = text === "decision:yes";
      if (ficha.id === 2) { s.step = yes ? 2 : ficha.passos.length; showStep(s); return s; }
      if (ficha.id === 7) { s.step = yes ? 2 : 1; showStep(s); return s; }
      if (ficha.id === 10 && yes) { transfer(s, "vazamento_proximo_parte_eletrica"); return s; }
      if (ficha.id === 12 && !yes) { transfer(s, "condicao_retrolavagem_nao_atendida"); return s; }
      if (ficha.id === 13 && !yes) { transfer(s, "porta_capsulas_nao_esta_cheio"); return s; }
      if (ficha.id === 3 && yes) { transfer(s, "reservatorio_ja_abastecido"); return s; }
      if (ficha.id === 11 && yes) { transfer(s, "reservatorio_ja_encaixado_e_cheio"); return s; }
      s.step++; showStep(s); return s;
    }
    if (ficha && isDecisionStep(ficha.id, s.step) && !s.awaitingStepQuestion) {
      const current = s.messages.at(-1);
      repeatChoice(s, "Responda à pergunta acima para seguir com a orientação.", current?.options?.filter((o) => o.id.startsWith("decision:")) || []);
      return s;
    }
    if (text === "step:video") {
      const video = videoFor(s.issueId!, s.model);
      if (video) send(s, { text: `${video.titulo}: ${video.url}`, options: [op("step:done", "Feito"), op("step:failed", "Não consegui")] });
      else send(s, { text: "Ainda não há vídeo verificado para este problema.", options: [op("step:done", "Feito"), op("step:failed", "Não consegui")] });
      return s;
    }
    if (text === "step:done") { s.awaitingStepQuestion = false; s.step++; showStep(s); return s; }
    if (text === "step:failed") {
      s.awaitingStepQuestion = false;
      s.failures++; if (!s.stepsFailed.includes(s.step)) s.stepsFailed.push(s.step);
      if (s.failures >= 3) transfer(s, "tres_tentativas_sem_sucesso");
      else send(s, { text: "Pode tentar novamente com calma. Se não conseguir executar este passo, peça uma pessoa a qualquer momento.", options: [op("step:done", "Consegui fazer"), op("step:failed", "Ainda não consegui")] });
      return s;
    }
    if (text === "step:help") { s.awaitingStepQuestion = true; send(s, { text: "Qual é sua dúvida sobre essa orientação? Pode escrever em uma frase." }); return s; }
    if (s.awaitingStepQuestion && answer && s.model && text) {
      s.awaitingStepQuestion = false;
      try {
        const result = await answer(s.model, text, `Ficha ${ficha?.id}, ${ficha?.titulo}. Passo atual: ${ficha?.passos[s.step]?.texto || ""}`);
        if (result) {
          s.aiCalls++; s.inputTokens += result.inputTokens || 0; s.outputTokens += result.outputTokens || 0;
          s.manualAnswerUsed = true;
          send(s, { text: result.text, source: result.source, ephemeral: true });
          send(s, { text: `O passo continua sendo: ${ficha?.passos[s.step]?.texto || "passo indisponível"}`, options: [op("step:done", "Consegui fazer"), op("step:failed", "Não consegui"), op("step:help", "Outra dúvida")] });
          return s;
        }
      } catch { /* Safe handoff below. */ }
      s.awaitingStepQuestion = true;
      send(s, { text: "Pode explicar sua dúvida de outra forma? Se preferir, escolha uma das opções abaixo.", options: [op("step:done", "Consegui fazer"), op("step:failed", "Não consegui"), op("support:human", "Central de Ajuda")] });
      return s;
    }
    repeatChoice(s, "Use as opções do passo ou peça um atendente.", [op("step:done", "Feito"), op("step:failed", "Não consegui"), op("step:help", "Não entendi o passo")]); return s;
  }

  if (s.stage === "confirmar") {
    if (text === "resolved:yes") { s.outcome = "resolvido_autodeclarado"; s.stage = "avaliar"; send(s, { text: "Que bom que conseguiu. Como avalia esta orientação?", tone: "success", options: [1, 2, 3, 4, 5].map((n) => op(`rating:${n}`, String(n))).concat(op("rating:skip", "Pular")) }); return s; }
    if (text === "resolved:no") { transfer(s, "nao_resolvido_apos_ficha"); return s; }
    repeatChoice(s, "O problema foi solucionado?", [op("resolved:yes", "Sim"), op("resolved:no", "Não")]); return s;
  }

  if (s.stage === "duvida") {
    if (text === "topic:problem") { s.stage = "problema"; send(s, { text: "Qual destes problemas parece com o seu?", options: problemOptions }); return s; }
    if (text === "question:another") { send(s, { text: "Pode perguntar. O que você gostaria de saber?" }); return s; }
    if (!text) { send(s, { text: "Escreva sua dúvida sobre a máquina para eu procurar no manual." }); return s; }
    const issue = !isQuestion(text) ? identificarFicha(text) : null;
    if (issue) { startFicha(s, issue.id); return s; }
    await answerQuestion(s, text, answer);
    return s;
  }

  if (s.stage === "avaliar") {
    if (text !== "rating:skip" && !/^rating:[1-5]$/.test(text)) {
      send(s, { text: "Escolha uma nota de 1 a 5 ou pule a avaliação.", options: [1, 2, 3, 4, 5].map((n) => op(`rating:${n}`, String(n))).concat(op("rating:skip", "Pular")) });
      return s;
    }
    const value = Number(text.replace(/^rating:/, ""));
    if (Number.isInteger(value) && value >= 1 && value <= 5) s.rating = value;
    s.stage = "encerrado";
    send(s, { text: "Obrigado! Atendimento encerrado.", options: [op("restart", "Começar outra conversa")], tone: "success" }); return s;
  }

  return s;
}

export function handoffReport(s: Conversation) {
  const ficha = s.issueId ? FICHA_POR_ID.get(s.issueId) : undefined;
  return {
    modelo: s.model || "não informado",
    problema: ficha?.titulo || (s.entry === "duvida" ? "Dúvida sobre a máquina" : "Relato fora das fichas"),
    ficha: ficha?.id || null,
    passosMostrados: s.stepsShown.map((i) => `${i + 1}. ${ficha?.passos[i]?.texto || ""}`),
    passosComDificuldade: s.stepsFailed.map((i) => i + 1),
    motivo: s.handoffReason || "não informado",
    resumo: s.handoffSummary || `Caso ${s.model || "sem modelo"}: ${ficha?.titulo || "relato sem ficha"}. Transferência registrada para continuidade do atendimento.`,
    proximaAcao: "Confirmar o relato, o modelo e as instruções aplicáveis no manual antes de orientar novos procedimentos."
  };
}
