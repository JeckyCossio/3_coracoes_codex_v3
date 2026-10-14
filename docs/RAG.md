# RAG do chatbot TRES

## Arquitetura

O backend Next.js mantém as 13 fichas como fluxo determinístico. Para dúvidas, `src/lib/rag.ts` gera o embedding da pergunta com OpenAI `text-embedding-3-small` (1536 dimensões), consulta o namespace do modelo no índice Pinecone (com score mínimo heurístico configurável por `RAG_MIN_SCORE`, sem interpretá-lo como probabilidade) e passa trechos e referências ao LLM via OpenRouter. Comparações explícitas entre modelos consultam os cinco namespaces. O ID inicial do LLM é `deepseek/deepseek-v4.1-flash`; `OPENROUTER_MODEL` continua configurável. Se não houver informação suficiente, o assistente pede esclarecimentos e oferece a Central de Ajuda. O PDF interno das fichas permanece fora da ingestão.

## Configuração

Preencha `.env.local` com `OPENAI_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX=tres-openai`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL=deepseek/deepseek-v4.1-flash` e `ENABLE_EXTERNAL_AI=1`. Chaves ficam apenas no servidor. O índice precisa existir, estar pronto, ser **dense**, **cosine**, ter **1536 dimensões** e não usar embedding integrado. O script não cria índices. Os namespaces são `lov`, `modo`, `passione`, `luna` e `touch`, criados quando houver vetores válidos.

## Ingestão

Coloque apenas manuais e guias públicos verificados em `data/manuais/<modelo>/`, com extensão PDF, TXT ou MD. Instale `pdftotext` para PDFs. Execute `npm run rag:ingest`. O script valida o índice, extrai o texto, preserva páginas e seções quando possível, gera embeddings em lotes e faz upsert com IDs determinísticos. Reexecução atualiza os registros; trechos excedentes de um documento alterado são removidos por prefixo, sem apagar outros documentos. PDF digitalizado sem texto extraível falha explicitamente; aplique OCR antes. A ingestão exige chaves válidas e consome créditos OpenAI/Pinecone.

## Testar

Rode `npm test`, `npm run typecheck` e `npm run build`. Com as chaves e ao menos um manual, rode a ingestão e confira os namespaces no Pinecone. Depois inicie `npm run dev` e faça uma dúvida sobre o modelo ingerido no chat. A resposta deve vir sem fonte visível. Repita com outro modelo para verificar o isolamento e com pergunta sem cobertura para conferir o pedido de esclarecimento. Não use `contexto_hackathon/fluxo.pdf` na ingestão.

## Estado verificado em 14/10/2026

Os 10 PDFs públicos dos cinco modelos foram copiados de `/home/mestre/Documents/Programation/QrCode/materiais/` para `data/manuais/<modelo>/`. A origem de cada PDF está em `data/manuais/INDICE.md`. O índice `tres-openai` foi validado por API: pronto, dense, cosine, 1536 dimensões e embedding externo. A ingestão produziu 291 registros: LOV 55, Modo 60, Passione 50, Luna 52 e Touch 74. Uma segunda ingestão manteve as mesmas contagens, sem duplicatas.

Busca real para uma dúvida sobre falta de água encontrou a seção pertinente nos namespaces LOV e Touch, sem cruzar modelos. OpenRouter respondeu a uma dúvida LOV com fonte do manual LOV, página 10; o motor do chat passou ao estado de confirmação. Uma pergunta sobre Wi-Fi, ausente no manual LOV, retornou sem resposta. O endpoint `/api/chat` também foi testado com um banco SQLite separado e retornou resposta com fonte; esse servidor usava o build anterior à regra de uma orientação por vez. A regra atual foi testada diretamente no motor RAG. Após esses testes, `ENABLE_EXTERNAL_AI=1` foi ativado localmente; reinicie o servidor de desenvolvimento que já estava em execução para carregar a variável atualizada.

## Limitação conhecida

Alguns PDFs têm múltiplas colunas e fontes com avisos de extração pelo Poppler. O texto ficou extraível, mas a ordem de trechos de procedimentos complexos pode exigir conferência humana com o PDF original. O chatbot mantém as fichas bloqueadas quando faltam validações por modelo. A fonte do manual não autoriza mudar a sequência das fichas.

## Verificação adicional de 14/10/2026

Foram executados testes locais, conferência das 13 fichas, busca real nos cinco namespaces e smoke test HTTP com SQLite isolado e IA desligada. A busca retornou trechos somente do modelo selecionado. O modelo DeepSeek foi testado com uma chamada RAG real. Um limite inicial de saída mostrou que o modelo consumia todo o orçamento em raciocínio sem resposta; a integração agora desativa esse raciocínio para as respostas curtas do chatbot e limita a saída. O teste final respondeu com fonte LOV, página 10, usando 32 tokens de saída. Os procedimentos continuam sujeitos à revisão humana dos PDFs originais, sobretudo páginas com colunas.
