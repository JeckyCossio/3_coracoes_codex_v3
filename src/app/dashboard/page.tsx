"use client";

import { useEffect, useState } from "react";

type Stats = {
  total: number; resolved: number; transferred: number; abandoned: number;
  resolutionRate: number; handoffRate: number; averageRating: number | null;
  averageDurationSeconds: number | null; aiCalls: number; estimatedCostUsd: number;
  costPerSelfResolutionUsd: number | null; byModel: Record<string, number>;
  byIssue: Record<string, number>; byModelIssue: Record<string, Record<string, number>>;
  byLayer: Record<string, number>; abandonedByIssueStep: Record<string, number>;
  dailyHandoffs: Record<string, number>; simulated: boolean;
};

const layerNames: Record<string, string> = {
  ficha_guiada: "Ficha guiada", ia_manual: "Resposta com manual", humano: "Transferência humana"
};

export default function Dashboard() {
  const [data, setData] = useState<Stats | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    fetch("/api/painel/stats", { cache: "no-store" })
      .then((response) => { if (!response.ok) throw new Error("Falha ao carregar indicadores"); return response.json(); })
      .then(setData)
      .catch(() => setError(true));
  }, []);
  const ranked = Object.entries(data?.byIssue || {}).sort((a, b) => b[1] - a[1]);
  const daily = Object.entries(data?.dailyHandoffs || {});

  return <main className="internal-shell">
    <nav className="internal-nav"><div className="pill-nav"><a href="/"><span aria-hidden="true">←</span>&nbsp;Conversa</a></div><strong>TRES Ajuda</strong><div className="pill-nav"><a href="/atendente">Fila&nbsp;<span aria-hidden="true">→</span></a></div></nav>
    <div className="internal-heading">
      <p className="chip">Área interna · melhoria contínua</p>
      <h1>O que a jornada <span className="pink">mostra</span></h1>
      <p>Indicadores do protótipo. Resolução é informada pelo próprio consumidor; não comprova chamados evitados.</p>
    </div>
    {error && <p className="error" role="alert">Não foi possível carregar os indicadores.</p>}
    {data?.simulated && <div className="sim-banner">Dados de demonstração, sem consumidores reais</div>}
    <div className="stat-grid">
      <div className="stat"><small>Casos encerrados</small><strong>{data?.total ?? "—"}</strong></div>
      <div className="stat"><small>Resolução autodeclarada</small><strong>{data ? `${Math.round(data.resolutionRate * 100)}%` : "—"}</strong><span>resolvidos ÷ (resolvidos + transferidos)</span></div>
      <div className="stat"><small>Transferidos</small><strong>{data?.transferred ?? "—"}</strong></div>
      <div className="stat"><small>Abandonados</small><strong>{data?.abandoned ?? "—"}</strong></div>
    </div>
    <div className="report-grid">
      <section className="report-panel">
        <h2>Problemas mais relatados</h2>
        {ranked.length ? ranked.map(([label, count]) => <div className="bar-row" key={label}><span>{label}</span><div><i style={{ width: `${Math.max(6, count / Math.max(1, ranked[0][1]) * 100)}%` }}/></div><b>{count}</b></div>) : <p>Os problemas aparecerão quando houver atendimentos.</p>}
      </section>
      <section className="report-panel">
        <h2>Por modelo</h2>
        {Object.entries(data?.byModel || {}).map(([label, count]) => <div className="model-row" key={label}><span>{label}</span><b>{count}</b></div>)}
        {!data || !Object.keys(data.byModel).length ? <p>Sem casos registrados.</p> : null}
        <div className="report-note"><b>Nota média</b><span>{data?.averageRating?.toFixed(1) || "—"} / 5</span></div>
        <div className="report-note"><b>Duração média</b><span>{data?.averageDurationSeconds == null ? "—" : `${Math.round(data.averageDurationSeconds)} s`}</span></div>
        <div className="report-note"><b>Chamadas de IA</b><span>{data?.aiCalls || 0}</span></div>
        <div className="report-note"><b>Custo estimado de IA</b><span>US$ {data?.estimatedCostUsd?.toFixed(4) || "0.0000"}</span></div>
        <div className="report-note"><b>Por resolução autodeclarada</b><span>{data?.costPerSelfResolutionUsd == null ? "—" : `US$ ${data.costPerSelfResolutionUsd.toFixed(4)}`}</span></div>
      </section>
    </div>
    <div className="report-grid">
      <section className="report-panel">
        <h2>Problemas por modelo</h2>
        {Object.entries(data?.byModelIssue || {}).map(([model, issues]) => <div className="model-group" key={model}>
          <h3>{model}</h3>
          {Object.entries(issues).sort((a, b) => b[1] - a[1]).map(([issue, count]) => <div className="model-row" key={issue}><span>{issue}</span><b>{count}</b></div>)}
        </div>)}
        {!data || !Object.keys(data.byModelIssue).length ? <p>Sem casos registrados.</p> : null}
      </section>
      <section className="report-panel">
        <h2>Camada final</h2>
        {Object.entries(data?.byLayer || {}).map(([layer, count]) => <div className="model-row" key={layer}><span>{layerNames[layer] || layer}</span><b>{count}</b></div>)}
        {!data || !Object.keys(data.byLayer).length ? <p>Sem casos registrados.</p> : null}
      </section>
    </div>
    <div className="report-grid">
      <section className="report-panel">
        <h2>Abandono por ficha e passo</h2>
        {Object.entries(data?.abandonedByIssueStep || {}).map(([step, count]) => <div className="model-row" key={step}><span>{step}</span><b>{count}</b></div>)}
        {!data || !Object.keys(data.abandonedByIssueStep).length ? <p>Nenhum abandono registrado.</p> : null}
      </section>
      <section className="report-panel">
        <h2>Transferências por dia</h2>
        {daily.map(([day, count]) => <div className="model-row" key={day}><span>{day}</span><b>{count}</b></div>)}
        {!daily.length && <p>Nenhuma transferência registrada.</p>}
        <p className="report-caption">Dias no horário de Brasília. A série mostra volume, sem inferir redução de chamados.</p>
      </section>
    </div>
    <p className="metric-footnote">Transferir um caso não significa que uma pessoa o resolveu. Para medir deflexão real, é preciso comparar com a linha de base de chamados da 3corações.</p>
  </main>;
}
