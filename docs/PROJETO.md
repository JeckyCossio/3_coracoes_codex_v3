# Estado do projeto — TRES Ajuda

Atualizado em 14/10/2026. Este projeto é independente da pasta usada pelo Kiro.

## Entregue

- App Next.js/TypeScript em português com chat web, fila do atendente e dashboard interno.
- Motor de conversa com seleção de cinco modelos, quatro problemas frequentes, “Outro problema”, 13 fichas, confirmação de resolução, nota opcional, pedido de humano e gatilhos de risco.
- Passos do fluxo do CS transcritos em `src/lib/fichas.ts`. Procedimentos sem validação por modelo e a resposta ausente de vazamento ficam bloqueados e geram transferência.
- SQLite para sessão, caso e fila simulada; abandono por dez minutos; separação entre resolução autodeclarada, transferência e abandono.
- Mini-relatório determinístico para o atendente, sem guardar o texto livre do consumidor.
- Integração RAG implementada com OpenAI `text-embedding-3-small` (1536 dimensões), Pinecone de vetores externos por namespace e OpenRouter configurável; desligada por padrão até chegarem credenciais e manuais. Detalhes em `docs/RAG.md`.
- Catálogo fechado de vídeos vazio, pronto para links verificados.
- 52 testes automatizados aprovados: 13 fichas, decisões condicionais, riscos, fallback, privacidade, persistência, abandono e fila. Typecheck, build e conferência das fichas aprovados.
- Teste de ponta a ponta da API em instância com banco isolado aprovado: entradas inválidas, autenticação, resolução, risco, transferência, fila e métricas. `npm audit --omit=dev --audit-level=high` não encontrou vulnerabilidades.
- Jornada visual conferida no navegador e em 390 px; recarregamento mantém o passo e o console ficou sem erros. Foram corrigidas respostas inválidas em decisões de sim/não, detecção de água perto da parte elétrica, avaliação inválida e tratamento de JSON inválido nas APIs.
- Revisão apenas de leitura do plano do Kiro em 14/10/2026: incorporados aviso específico para modelos não cobertos, transferência após duas entradas não compreendidas, descarte do histórico temporário ao encerrar, ramificações das fichas 02 e 07 e duração/camada/problema por modelo/abandono por ficha e passo/transferências diárias no painel. A migração do SQLite existente foi validada.

## Como continuar

1. Ler `README.md` e executar `npm install`, `npm run dev`.
2. Preencher `.env.local` com senha de demonstração. Não publicar esse arquivo.
3. Revisar as 13 fichas e comparar com manual/guia do modelo. Dar atenção especial a reset, retrolavagem, força na alavanca e vazamento.
4. Quando os manuais públicos forem entregues, salvar em `data/manuais/<modelo>/` e rodar `npm run rag:ingest` com chaves OpenAI e Pinecone.
5. Testar o modelo escolhido no OpenRouter com perguntas reais e fontes. Só então usar `ENABLE_EXTERNAL_AI=1`.
6. Adicionar links oficiais e verificados em `src/lib/videos.ts`.
7. Se houver autorização e acesso ao canal, escrever um adaptador para a API oficial do WhatsApp; o motor atual pode ser reutilizado.

## Pendências externas

- Manuais e guias rápidos dos cinco modelos, links de vídeo e chaves OpenAI/OpenRouter/Pinecone. O ID inicial do modelo é `deepseek/deepseek-v4.1-flash`.
- Revisão humana das fichas e das regras de segurança, conteúdo da “resposta de e-mail 37”, fluxo real de assistência e termo de confidencialidade.
- Linha de base de volume/custo de chamados para estimar deflexão real.

## Decisões de produto

O QR e as outras páginas serão feitos pelo time depois. Aqui há só o chatbot. Na demo, o consumidor escolhe o modelo manualmente. “Outro problema” tenta classificar o relato nas fichas; se faltar fonte, abre uma transferência. O atendente vê uma fila simulada. O dashboard é do time interno de melhorias. A IA não inventa passos nem URLs. O objetivo é demonstrar uma jornada e um método de medição, sem alegar impacto já realizado.

O plano do Kiro propunha pedir confirmação do usuário para prosseguir nas fichas 05 e 09. Sem comandos validados por modelo, este projeto mantém esses procedimentos bloqueados e transfere; uma confirmação isolada não basta para torná-los seguros. O painel também não chama transferências de “não resolvidos”, pois o atendimento humano ainda está pendente. A classificação de assunto fora do escopo continua limitada a entradas inválidas no menu; uma classificação semântica completa depende de avaliar o modelo real com exemplos.
