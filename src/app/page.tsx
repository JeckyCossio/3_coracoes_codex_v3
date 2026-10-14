"use client";

import { useEffect, useRef, useState } from "react";
import type { Conversation } from "@/lib/conversation";

type LocalUserMessage = { at: number; text: string };

export default function Home() {
  const [state, setState] = useState<Conversation | null>(null);
  const [busy, setBusy] = useState(true);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [userMessages, setUserMessages] = useState<LocalUserMessage[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sessionId = localStorage.getItem("tres-session") || undefined;
    const sessionToken = localStorage.getItem("tres-session-token") || undefined;
    const model = new URLSearchParams(window.location.search).get("modelo") || undefined;
    fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, sessionToken, model }) })
      .then((r) => { if (!r.ok) throw new Error("Falha ao iniciar"); return r.json(); })
      .then((data) => { localStorage.setItem("tres-session", data.sessionId); if (data.sessionToken) localStorage.setItem("tres-session-token", data.sessionToken); setDemoMode(Boolean(data.demoMode)); setState(data.state); })
      .catch(() => setError("Não foi possível abrir a conversa. Atualize a página e tente novamente."))
      .finally(() => setBusy(false));
  }, []);

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [state, userMessages]);

  async function send(id: string, label?: string) {
    if (!state || busy) return;
    const input = id.trim();
    if (!input) return;
    const at = state.messages.length;
    setBusy(true); setError(""); setDraft("");
    if (input === "restart") setUserMessages([]);
    else setUserMessages((items) => [...items, { at, text: label || input }]);
    try {
      const sessionToken = localStorage.getItem("tres-session-token") || undefined;
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: state.id, sessionToken, input }) });
      if (!response.ok) throw new Error("Falha ao enviar");
      const data = await response.json();
      localStorage.setItem("tres-session", data.sessionId);
      if (data.sessionToken) localStorage.setItem("tres-session-token", data.sessionToken);
      else localStorage.removeItem("tres-session-token");
      setDemoMode(Boolean(data.demoMode));
      setState(data.state);
    } catch {
      setUserMessages((items) => items.slice(0, -1));
      setError("A mensagem não foi enviada. Tente novamente.");
    } finally { setBusy(false); }
  }

  const last = state?.messages.at(-1);
  const canType = state && !["avaliar", "encerrado", "transferido"].includes(state.stage);
  return <main className="site-shell">
    <header className="site-header">
      <img className="brand-logo" src="/brand/cafeina-3coracoes.svg" alt="cafeína e 3corações" width="140" height="45"/>
      <div><strong>TRES Ajuda</strong><small className="k">Protótipo de autoatendimento</small></div>
      <a className="materials-link" href={`/ajuda${state?.model ? `?modelo=${state.model.toLowerCase()}` : ""}`}>← Guias e vídeos</a>
    </header>
    <section className="intro">
      <div className="intro-copy"><p className="chip">A ajuda começa por aqui</p><h1>Seu café de volta,<br/><em>um passo de cada vez.</em></h1><p>Escolha a máquina e conte o que aconteceu. Se o caso precisar de uma pessoa, o contexto segue junto.</p></div>
      <ol className="intro-steps"><li><span className="n">01</span><p>Modelo</p></li><li><span className="n">02</span><p>Problema</p></li><li><span className="n">03</span><p>Orientação</p></li></ol>
    </section>
    <section className="chat-panel" aria-label="Conversa de autoatendimento">
      <div className="chat-top"><div className="avatar">T</div><div><strong>Assistente TRES</strong><small>{state?.model ? `Máquina ${state.model}` : "Escolha seu modelo para começar"}</small></div><div className="online"><span/> Protótipo</div></div>
      <div className="chat-log" role="log" aria-live="polite" ref={logRef}>
        <p className="privacy-note">Conversa de demonstração. Nenhum atendente real recebe as mensagens.</p>
        {state?.messages.map((message, index) => <div key={index}>
          {userMessages.filter((item) => item.at === index).map((item, i) => <div className="bubble-row user" key={i}><div className="bubble user-bubble">{item.text}</div></div>)}
          <div className="bubble-row"><div className={`bubble bot-bubble ${message.tone || ""}`}>{message.text}{message.source && <small className="source">{message.source}</small>}</div></div>
        </div>)}
        {userMessages.filter((item) => item.at >= (state?.messages.length || 0)).map((item, i) => <div className="bubble-row user" key={i}><div className="bubble user-bubble">{item.text}</div></div>)}
        {busy && <div className="bubble-row"><div className="bubble bot-bubble typing">Preparando a próxima orientação…</div></div>}
      </div>
      <div className="chat-actions">
        {last?.options && <div className="quick-options">{last.options.map((option) => <button type="button" key={option.id} disabled={busy} onClick={() => send(option.id, option.label)}>{option.label}</button>)}</div>}
        {canType && <form className="compose" onSubmit={(event) => { event.preventDefault(); send(draft); }}><label className="sr-only" htmlFor="message">Sua mensagem</label><input id="message" value={draft} maxLength={800} onChange={(event) => setDraft(event.target.value)} placeholder="Escreva sua mensagem ou peça um atendente" disabled={busy}/><button type="submit" disabled={busy || !draft.trim()} aria-label="Enviar mensagem"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></form>}
        {error && <p className="error" role="alert">{error}</p>}
      </div>
    </section>
    <footer className="site-footer"><span>Baseado no fluxo de atendimento do desafio · Conteúdo por modelo pendente de validação</span>{!demoMode && <nav className="pill-nav" aria-label="Áreas internas"><a href="/atendente">Fila simulada</a><a href="/dashboard">Indicadores</a></nav>}</footer>
  </main>;
}
