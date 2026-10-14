export const MODELOS = ["LOV", "Modo", "Passione", "Luna", "Touch"] as const;
export type Modelo = (typeof MODELOS)[number];

export type Passo = {
  texto: string;
  /** The source requires a model-specific manual or unavailable material before this step. */
  bloqueado?: string;
};

export type Ficha = {
  id: number;
  titulo: string;
  pagina: number;
  palavras: string[];
  passos: Passo[];
  observacao?: string;
};

// Fonte: Mapa da Jornada de Atendimento, páginas 2–8. As fichas são um
// roteiro interno do CS; a aplicabilidade por modelo precisa ser validada.
export const FICHAS: Ficha[] = [
  { id: 1, titulo: "Máquina não está ligando", pagina: 2, palavras: ["nao liga", "não liga", "sem energia", "nao acende", "não acende"], passos: [
    { texto: "Confira se a máquina está ligada diretamente à tomada, sem adaptador, filtro de linha ou estabilizador." },
    { texto: "Se puder fazer isso com segurança, experimente outra tomada compatível com a voltagem da máquina." },
    { texto: "Confira a voltagem indicada na máquina e a voltagem da tomada. Se não souber, pare e peça ajuda." }
  ] },
  { id: 2, titulo: "Luz vermelha fixa", pagina: 2, palavras: ["luz vermelha fixa", "vermelho fixo"], passos: [
    { texto: "Ligue a máquina e aguarde as teclas pararem de piscar." },
    { texto: "Depois de aguardar, o alerta vermelho continua aceso de forma fixa?" },
    { texto: "Se o alerta continuar fixo, experimente outra tomada da mesma voltagem, se puder fazê-lo com segurança." }
  ] },
  { id: 3, titulo: "Alerta vermelho piscando", pagina: 3, palavras: ["vermelho piscando", "luz vermelha pisca", "alerta vermelho"], passos: [
    { texto: "Verifique se o reservatório tem água." },
    { texto: "Se estiver vazio, abasteça até o nível máximo indicado." },
    { texto: "O fluxo do CS orienta acionar a tecla azul e aguardar a passagem de água terminar sozinha.", bloqueado: "É preciso confirmar no manual da sua máquina que a tecla azul executa essa função." }
  ] },
  { id: 4, titulo: "Teclas das xícaras e sensor vermelho piscando", pagina: 3, palavras: ["todas as luzes piscando", "teclas piscando", "sensor vermelho"], passos: [
    { texto: "O fluxo do CS orienta fazer uma passagem de água e aguardar o término.", bloqueado: "O procedimento de passagem de água ainda precisa ser confirmado para este modelo." }
  ], observacao: "O PDF considera possível um reset sem passagem de água concluída; não é diagnóstico confirmado." },
  { id: 5, titulo: "Luz amarela acesa", pagina: 4, palavras: ["luz amarela", "amarelo aceso"], passos: [
    { texto: "O fluxo descreve um reset do contador volumétrico.", bloqueado: "Esse reset altera o estado da máquina e ainda não foi validado no manual deste modelo." }
  ] },
  { id: 6, titulo: "Não extrai bebidas", pagina: 4, palavras: ["nao extrai", "não extrai", "nao sai cafe", "não sai café", "capsula nao sai"], passos: [
    { texto: "Com água no reservatório, observe se o alerta vermelho aparece durante a tentativa de extração." },
    { texto: "Verifique se o mesmo problema acontece com outra cápsula." },
    { texto: "O fluxo cita reset e duas passagens de água, preferencialmente com cápsula de retrolavagem.", bloqueado: "O reset e a retrolavagem ainda precisam de instruções validadas para este modelo." }
  ] },
  { id: 7, titulo: "Bebida aguada", pagina: 5, palavras: ["aguada", "fraca", "muita agua", "muita água"], passos: [
    { texto: "A cor da tecla usada corresponde à cor indicada na cápsula?" },
    { texto: "Se não corresponder, use a cor indicada na cápsula na próxima bebida." },
    { texto: "O fluxo pede verificar o volume extraído.", bloqueado: "Falta a tabela de volumes do manual desta máquina para comparar o resultado." }
  ] },
  { id: 8, titulo: "Bebida fria", pagina: 5, palavras: ["bebida fria", "cafe frio", "café frio", "nao esquenta", "não esquenta"], passos: [
    { texto: "O fluxo sugere reset, ajuste de temperatura e, se necessário, preaquecimento da xícara.", bloqueado: "Faltam os comandos e limites de temperatura do manual deste modelo." }
  ] },
  { id: 9, titulo: "Alavanca travada", pagina: 6, palavras: ["alavanca travada", "alavanca presa", "alavanca emperrada"], passos: [
    { texto: "O fluxo descreve liberar a alavanca com força.", bloqueado: "Não é seguro orientar força mecânica sem validação do procedimento para o modelo. Um atendente deve assumir." }
  ] },
  { id: 10, titulo: "Vazamento", pagina: 6, palavras: ["vazando", "vazamento", "pingando", "agua por baixo", "água por baixo"], passos: [
    { texto: "Observe sem tocar na parte elétrica: a água está perto da tomada ou do cabo? Se sim, pare o uso e peça atendimento." },
    { texto: "O fluxo pede distinguir vazamento externo de resíduo no compartimento de cápsulas.", bloqueado: "A orientação citada como 'resposta de e-mail 37' não foi fornecida. Este caso precisa de atendimento humano." }
  ] },
  { id: 11, titulo: "Não puxa água", pagina: 7, palavras: ["nao puxa agua", "não puxa água", "sem agua", "sem água"], passos: [
    { texto: "Confira se o reservatório contém água e está bem encaixado." },
    { texto: "Se estiver mal encaixado, retire e recoloque o reservatório." },
    { texto: "O fluxo orienta acionar a tecla azul e aguardar; se necessário, repetir.", bloqueado: "Confirme no manual deste modelo o comando correto antes de executar a passagem de água." }
  ] },
  { id: 12, titulo: "Bico entupido", pagina: 7, palavras: ["bico entupido", "entupido", "cafe na bandeja", "café na bandeja"], passos: [
    { texto: "Verifique se a bebida saiu na bandeja de descarte de cápsulas." },
    { texto: "Se a bebida saiu na bandeja, o fluxo orienta cinco retrolavagens e nova extração.", bloqueado: "Falta confirmar o procedimento de retrolavagem do seu modelo antes de executá-lo." }
  ], observacao: "As cinco retrolavagens só são indicadas no PDF se a bebida saiu na bandeja." },
  { id: 13, titulo: "Alavanca não fecha com cápsula", pagina: 8, palavras: ["alavanca nao fecha", "alavanca não fecha", "nao fecha capsula", "não fecha cápsula"], passos: [
    { texto: "Confira se o porta-cápsulas está cheio." },
    { texto: "Se estiver cheio, esvazie e limpe o porta-cápsulas conforme o guia da sua máquina." }
  ] }
];

export const FICHA_POR_ID = new Map(FICHAS.map((f) => [f.id, f]));
export const PRINCIPAIS = [10, 12, 11, 6] as const;

export function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function identificarFicha(texto: string): Ficha | null {
  const alvo = normalizar(texto);
  const matches = FICHAS.filter((f) => f.palavras.some((p) => alvo.includes(normalizar(p))));
  return matches.length === 1 ? matches[0] : null;
}
