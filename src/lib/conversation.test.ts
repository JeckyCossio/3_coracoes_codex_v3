import { describe, expect, it } from "vitest";
import { newConversation, processar } from "./conversation";
import { FICHAS } from "./fichas";

async function sequence(inputs: string[]) {
  let s = newConversation("test-session");
  for (const input of inputs) s = await processar(s, input);
  return s;
}

describe("jornada de autoatendimento", () => {
  it("encerra como resolução autodeclarada após uma ficha simples", async () => {
    const s = await sequence(["model:LOV", "topic:problem", "issue:other", "alavanca não fecha com cápsula", "decision:yes", "step:done", "resolved:yes", "rating:4"]);
    expect(s.stage).toBe("encerrado");
    expect(s.outcome).toBe("resolvido_autodeclarado");
    expect(s.issueId).toBe(13);
    expect(s.rating).toBe(4);
  });

  it("não oferece instrução ausente para vazamento", async () => {
    const s = await sequence(["model:Touch", "topic:problem", "issue:10", "decision:no"]);
    expect(s.stage).toBe("transferido");
    expect(s.handoffReason).toBe("instrucao_sem_validacao_por_modelo");
    expect(s.messages.at(-2)?.text).toMatch(/e-mail 37/);
  });

  it("interrompe a jornada imediatamente quando há sinal elétrico", async () => {
    const s = await sequence(["model:Luna", "topic:problem", "issue:11", "levei um choque"]);
    expect(s.outcome).toBe("transferido_pendente");
    expect(s.handoffReason).toBe("sinal_de_risco");
  });

  it("bloqueia vazamento próximo da tomada antes de orientar o próximo passo", async () => {
    const s = await sequence(["model:Touch", "topic:problem", "issue:10", "decision:yes"]);
    expect(s.handoffReason).toBe("vazamento_proximo_parte_eletrica");
    expect(s.stepsShown).toEqual([0]);
  });

  it("reconhece o primeiro pedido por atendimento humano", async () => {
    const s = await sequence(["model:Modo", "quero falar com uma pessoa"]);
    expect(s.handoffReason).toBe("pedido_expresso");
  });

  it("explica os modelos cobertos antes de transferir outra máquina", async () => {
    const s = await sequence(["model:other"]);
    expect(s.handoffReason).toBe("modelo_fora_do_escopo");
    expect(s.messages.at(-2)?.text).toContain("LOV, Modo, Passione, Luna e Touch");
  });

  it("redireciona uma entrada fora do assunto e transfere após insistência", async () => {
    let s = await sequence(["model:LOV", "qual a previsão do tempo?"]);
    expect(s.stage).toBe("menu");
    expect(s.messages.at(-1)?.text).toContain("máquinas TRES");
    s = await processar(s, "conte uma piada");
    expect(s.handoffReason).toBe("duas_entradas_nao_compreendidas");
  });

  it("zera o contador de entradas inválidas após uma escolha válida", async () => {
    let s = await sequence(["model:LOV", "texto inválido", "topic:problem", "texto inválido"]);
    expect(s.stage).toBe("problema");
    expect(s.misunderstandings).toBe(1);
  });

  it("responde dúvida apenas quando o adaptador retorna fonte", async () => {
    let s = await sequence(["model:Passione", "topic:question"]);
    s = await processar(s, "Como limpar?", undefined, async () => ({ text: "Veja a limpeza na seção 4.", source: "Manual Passione · p. 4" }));
    expect(s.stage).toBe("confirmar");
    expect(s.messages.at(-2)?.source).toContain("Passione");
    const noSource = await sequence(["model:Passione", "topic:question", "Como limpar?"]);
    expect(noSource.handoffReason).toBe("manual_sem_resposta_verificada");
  });

  it("esclarece um passo pelo manual sem trocar o procedimento", async () => {
    let s = await sequence(["model:LOV", "topic:problem", "issue:other", "máquina não liga", "step:help"]);
    let context = "";
    s = await processar(s, "Onde fica o reservatório?", undefined, async (_model, _question, currentStep) => {
      context = currentStep || "";
      return { text: "O reservatório fica na parte traseira.", source: "Guia LOV · p. 2" };
    });
    expect(context).toContain("Passo atual:");
    expect(s.stage).toBe("guia");
    expect(s.step).toBe(0);
    expect(s.messages.at(-2)?.source).toContain("Guia LOV");
  });

  it.each(FICHAS.map((ficha) => [ficha.id, ficha.palavras[0]] as const))(
    "classifica a ficha %i pelo relato e apresenta uma fonte ou transfere com segurança",
    async (id, relato) => {
      const s = await sequence(["model:LOV", "topic:problem", "issue:other", relato]);
      expect(s.issueId).toBe(id);
      expect(["guia", "transferido"]).toContain(s.stage);
      expect(s.messages.some((m) => m.source === `Fluxo CS, ficha ${id}, p. ${FICHAS[id - 1].pagina}`)).toBe(true);
    }
  );

  it.each([3, 10, 11, 12, 13])("não interpreta resposta inválida como não na ficha %i", async (id) => {
    let s = await sequence(["model:LOV", "topic:problem", "issue:other", FICHAS[id - 1].palavras[0]]);
    s = await processar(s, "decision:maybe");
    expect(s.stage).toBe("guia");
    expect(s.step).toBe(0);
    expect(s.messages.at(-1)?.options?.map((o) => o.id)).toEqual(["decision:yes", "decision:no"]);
  });

  it("só recomenda outra tomada na ficha 02 se a luz vermelha continuar fixa", async () => {
    const prefix = ["model:LOV", "topic:problem", "issue:other", "luz vermelha fixa", "step:done"];
    const cleared = await sequence([...prefix, "decision:no"]);
    expect(cleared.stage).toBe("confirmar");
    expect(cleared.stepsShown).toEqual([0, 1]);
    const persisted = await sequence([...prefix, "decision:yes"]);
    expect(persisted.stage).toBe("guia");
    expect(persisted.step).toBe(2);
    expect(persisted.messages.at(-1)?.text).toContain("outra tomada");
  });

  it("pula a correção da tecla na ficha 07 quando a cor já corresponde", async () => {
    const prefix = ["model:LOV", "topic:problem", "issue:other", "bebida aguada"];
    const correct = await sequence([...prefix, "decision:yes"]);
    expect(correct.handoffReason).toBe("instrucao_sem_validacao_por_modelo");
    expect(correct.stepsShown).toEqual([0]);
    const wrong = await sequence([...prefix, "decision:no"]);
    expect(wrong.stage).toBe("guia");
    expect(wrong.step).toBe(1);
    expect(wrong.messages.at(-1)?.text).toContain("use a cor indicada");
  });

  it.each([
    [3, "decision:yes", "reservatorio_ja_abastecido"],
    [10, "decision:yes", "vazamento_proximo_parte_eletrica"],
    [11, "decision:yes", "reservatorio_ja_encaixado_e_cheio"],
    [12, "decision:no", "condicao_retrolavagem_nao_atendida"],
    [13, "decision:no", "porta_capsulas_nao_esta_cheio"]
  ] as const)("transfere pela condição da ficha %i", async (id, answer, reason) => {
    const s = await sequence(["model:LOV", "topic:problem", "issue:other", FICHAS[id - 1].palavras[0], answer]);
    expect(s.handoffReason).toBe(reason);
  });

  it("transfere após três falhas no mesmo passo e conserva o relatório", async () => {
    const s = await sequence(["model:LOV", "topic:problem", "issue:other", "máquina não liga", "step:failed", "step:failed", "step:failed"]);
    expect(s.handoffReason).toBe("tres_tentativas_sem_sucesso");
    expect(s.stepsFailed).toEqual([0]);
    expect(s.failures).toBe(3);
  });

  it.each(["água perto do cabo", "cabo molhado", "fumaça", "levei choque"])("transfere ao detectar risco: %s", async (relato) => {
    const s = await sequence(["model:LOV", relato]);
    expect(s.handoffReason).toBe("sinal_de_risco");
  });

  it("pede uma avaliação válida sem fechar a conversa por engano", async () => {
    let s = await sequence(["model:LOV", "topic:problem", "issue:other", "alavanca não fecha", "decision:yes", "step:done", "resolved:yes"]);
    s = await processar(s, "rating:9");
    expect(s.stage).toBe("avaliar");
    s = await processar(s, "rating:skip");
    expect(s.stage).toBe("encerrado");
    expect(s.rating).toBeUndefined();
  });

  it("não consulta o manual quando a dúvida está vazia", async () => {
    let calls = 0;
    let s = await sequence(["model:LOV", "topic:question"]);
    s = await processar(s, "   ", undefined, async () => { calls++; return null; });
    expect(s.stage).toBe("duvida");
    expect(calls).toBe(0);
  });

  it("faz uma pergunta de esclarecimento e transfere um relato sem correspondência", async () => {
    let s = await sequence(["model:LOV", "topic:problem", "issue:other", "barulho intermitente"]);
    expect(s.stage).toBe("esclarecer");
    s = await processar(s, "continua fazendo barulho");
    expect(s.handoffReason).toBe("relato_sem_ficha_e_sem_manual_validado");
  });

  it("transfere a dúvida sobre um passo quando o manual não traz fonte", async () => {
    let s = await sequence(["model:LOV", "topic:problem", "issue:other", "máquina não liga", "step:help"]);
    s = await processar(s, "O que é a voltagem?", undefined, async () => null);
    expect(s.handoffReason).toBe("duvida_do_passo_sem_fonte");
  });

  it("não altera uma conversa encerrada ao receber mensagem repetida", async () => {
    let s = await sequence(["model:LOV", "quero falar com pessoa"]);
    const before = s.updatedAt;
    s = await processar(s, "step:done", undefined, undefined, before + 1000);
    expect(s.updatedAt).toBe(before);
    expect(s.messages).toHaveLength(3);
  });
});
