# TRES Ajuda — protótipo do chatbot

Protótipo do Desafio 03 do Hackathon Cafeína Week 2026. O consumidor escolhe o modelo da máquina, segue uma orientação do fluxo de atendimento, confirma se resolveu e, quando necessário, gera uma transferência simulada com contexto para o atendente.

## Executar

Requer Node.js 24 ou mais recente. Para a extração de manuais PDF, requer `pdftotext` (Poppler).

```bash
npm install
cp .env.example .env.local
# edite PAINEL_SENHA em .env.local
npm run dev
```

Abra `http://localhost:3000/ajuda` para começar pela página do QR Code, ou `http://localhost:3000` para abrir o chatbot diretamente. A tela do atendente fica em `/atendente` e o painel de indicadores em `/dashboard`. As telas internas pedem autenticação Basic: qualquer nome de usuário e a senha `PAINEL_SENHA`.

## Jornada integrada do QR Code

A página móvel do projeto `QrCode` agora faz parte desta aplicação em `/ajuda`. Ela reúne tutoriais, manuais, guias rápidos e materiais de limpeza dos cinco modelos. O visual e as páginas de conteúdo seguem os arquivos originais do projeto QR. O primeiro botão, **Atendimento WhatsApp**, abre o chatbot web neste mesmo endereço; o link no cabeçalho do chatbot retorna aos materiais do modelo escolhido. O botão simula a entrada do atendimento, sem conexão com o WhatsApp real.

Cada QR pode apontar para a URL pública de um modelo. Localmente, os caminhos são:

```text
http://localhost:3000/ajuda?modelo=lov
http://localhost:3000/ajuda?modelo=modo
http://localhost:3000/ajuda?modelo=passione
http://localhost:3000/ajuda?modelo=luna
http://localhost:3000/ajuda?modelo=touch
```

Sem `?modelo=`, a pessoa escolhe o modelo na página de materiais. Com o parâmetro, os materiais desse modelo são exibidos. Ao abrir o chatbot, a conversa começa apenas após a primeira mensagem; o cliente escolhe o assunto e, se for sobre a máquina, seleciona o modelo. Ao publicar, substitua apenas `http://localhost:3000` pelo domínio definitivo antes de gerar os QR Codes para impressão.

Verificação:

```bash
npm run fichas:check
npm test
npm run typecheck
npm run build
```

Teste de ponta a ponta da API, com o servidor em execução e uma senha de painel configurada:

```bash
BASE_URL=http://localhost:3000 PANEL_PASSWORD=sua-senha npm run smoke:api
```

Esse teste cria casos simulados. Use uma instância com `SQLITE_PATH` separado do banco da demonstração quando quiser manter as métricas limpas.

## Teste do chatbot na Vercel

Importe `JeckyCossio/3_coracoes_codex_v3` com preset **Next.js** e diretório raiz `./`. Mantenha os comandos de instalação, build e diretório de saída automáticos. Configure as variáveis de ambiente do servidor no projeto Vercel (sem `NEXT_PUBLIC_`): `CHAT_STORAGE=signed`, `SESSION_SECRET` com no mínimo 32 caracteres aleatórios, `ENABLE_EXTERNAL_AI=1`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENAI_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX` e `RAG_MIN_SCORE`. Use os valores de `.env.local` para as chaves, sem publicá-los no repositório. Uma chave aleatória pode ser gerada localmente com `openssl rand -hex 32`.

Esse modo é apenas para testar o chatbot. A sessão fica no navegador em um token assinado e expira após 24 horas sem interação. A fila e os indicadores não são persistidos; transferências informam que o consumidor deve buscar os canais oficiais. Para uma implantação com fila e indicadores, será necessário trocar o SQLite por um banco persistente compartilhado.

## Demonstração sem chaves

1. Envie uma mensagem, escolha **Problema ou dúvida da máquina → LOV → Problema na máquina → Outro problema** e escreva `alavanca não fecha com cápsula`.
2. Informe que o porta-cápsulas está cheio, siga o passo de limpeza e confirme **Sim, resolveu**. A resolução será registrada como **autodeclarada**.
3. Inicie outra conversa. Escolha **Problema ou dúvida da máquina → Touch → Problema na máquina → Vazamento**. O fluxo identifica a falta da orientação “e-mail 37” e apresenta o telefone de atendimento.
4. Abra `/atendente` para ver o resumo e `/dashboard` para ver os dois casos. Os dados são marcados como simulados.

## Testar como consumidor

1. Abra `http://localhost:3000` em uma janela anônima para iniciar uma sessão nova. Se o servidor não estiver aberto, execute `npm run dev`.
2. Escreva **“Qual a diferença dos botões das máquinas da 3 corações?”**, escolha **Problema ou dúvida da máquina → LOV**. A resposta deve explicar as teclas da LOV sem mostrar fontes ou termos internos.
3. Inicie outra conversa e escolha **Problema ou dúvida da máquina → Touch → Dúvida sobre a máquina**. Pergunte sobre o reservatório; a resposta deve usar apenas informações da Touch.
4. Faça uma pergunta sem cobertura, como **“Como conecto a LOV ao Wi-Fi?”**. O assistente deve pedir esclarecimentos ou indicar a Central de Ajuda, sem inventar instruções.
5. Para verificar o vídeo antes dos passos, descreva **“O bico está entupido”**, escolha **Problema ou dúvida da máquina → Luna** e escolha entre assistir ao tutorial ou receber orientação por mensagens.
6. Para testar outro assunto, escolha **Outro problema ou dúvida**, descreva uma dúvida geral e confirme se a resposta ajudou. Caso não haja resposta segura, o chat informa o número **0800.031.3033**.
7. Para ver a fila simulada e os indicadores, abra `/atendente` e `/dashboard` com qualquer usuário e a `PAINEL_SENHA` do seu `.env.local`.

A transferência é simulada e não chega a uma pessoa real. As fichas técnicas ainda exigem revisão humana por modelo antes de atendimento público.

## IA e manuais

A integração RAG usa embeddings OpenAI `text-embedding-3-small`, um índice Pinecone de vetores externos e OpenRouter para gerar a resposta. O modelo inicial é DeepSeek V4.1 Flash e pode ser alterado por `OPENROUTER_MODEL`. Consulte [docs/RAG.md](docs/RAG.md) para configuração, ingestão, testes e pendências. O PDF interno do fluxo não entra no Pinecone.

## Como funciona

- `src/lib/conversation.ts`: motor de estados sem dependência do canal. Recebe evento e estado; devolve a próxima etapa e as mensagens.
- `src/lib/fichas.ts`: 13 fichas estruturadas do PDF do desafio. Passos dependentes de manual ou de material ausente são bloqueados para transferência.
- `src/lib/ai.ts`: classificação de falhas da máquina e respostas gerais sobre outros assuntos pelo OpenRouter, quando habilitada.
- `src/lib/rag.ts`: embedding da pergunta, busca nos manuais do modelo e resposta fundamentada. A referência fica interna; comparações explícitas entre modelos consultam os namespaces relevantes.
- `src/lib/db.ts`: sessões, casos e fila simulada em SQLite.
- `src/app/api/chat`: API da conversa; `/api/painel/*`: fila e indicadores.

O navegador mantém o ID da sessão no `localStorage`. Durante a conversa, o banco guarda o estado e mensagens do **bot**, inclusive as respostas dinâmicas, mas não o texto livre digitado pelo consumidor. Ao encerrar ou transferir, resta só a mensagem final na sessão. O mini-relatório tem resumo determinístico por padrão e pode receber um resumo de IA a partir de códigos estruturados, sem relato literal do usuário. O histórico visual das mensagens do usuário desaparece após recarregar a página.

## Métricas

O painel separa resolução autodeclarada, transferência pendente e abandono. **Taxa de resolução entre casos concluídos** = resoluções autodeclaradas ÷ (resoluções autodeclaradas + transferências). Abandono é mostrado separadamente. Também aparecem duração média, camada final, problemas por modelo, abandono por ficha e passo e transferências por dia no horário de Brasília. Transferência significa que um item entrou na fila simulada; não confirma atendimento ou solução por pessoa. A métrica não prova deflexão de chamados sem comparação com uma linha de base real.

Custo estimado de IA = `(tokens_entrada × LLM_INPUT_USD_PER_M + tokens_saida × LLM_OUTPUT_USD_PER_M) / 1.000.000`. Preencha as tarifas do modelo escolhido no `.env.local`; os valores padrão são zero e não representam gratuidade real. O custo por resolução divide esse total pelas resoluções autodeclaradas e é apenas uma aproximação.

## Limites e próximos passos

- Esta é uma **interface web que simula a etapa de WhatsApp**. Não existe número, webhook nem atendimento humano real. O motor foi separado do canal para permitir um adaptador oficial depois.
- As instruções das fichas foram transcritas do fluxo interno, que não comprova aplicabilidade idêntica aos cinco modelos. Validar cada procedimento com os manuais e com Customer Success antes de uso público. As fichas 05, 06, 08, 09, 10 e 12 incluem pontos bloqueados; outras também podem exigir revisão.
- A “resposta de e-mail 37” da ficha 10 não foi fornecida. O bot encaminha o caso em vez de improvisar.
- As chaves e os manuais públicos já estão configurados nesta instalação local; as chaves não são versionadas. A origem dos PDFs incluídos está em `data/manuais/INDICE.md`. Os vídeos públicos são selecionados por modelo e assunto a partir do catálogo da página `/ajuda`; o chatbot não inventa URLs. Confirme o termo de confidencialidade antes de enviar material interno a serviços externos. O código envia ao Pinecone apenas manuais públicos; no RAG, o OpenRouter recebe a pergunta e trechos dos manuais. Na classificação de falhas e no ramo de outros assuntos, o OpenRouter recebe o relato breve do cliente.
- Em produção, substituir a senha Basic e o SQLite por autenticação e armazenamento corporativos, definir retenção e consentimento, validar segurança de conteúdo e integrar o canal WhatsApp e o atendimento humano.

O estado do trabalho para continuar em outra sessão está em `docs/PROJETO.md`.
