const app = document.querySelector("#app");

const icons = {
  video: '<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="3" y="6" width="22" height="16" rx="3"/><path d="m12 10 6 4-6 4z"/></svg>',
  manual: '<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M5 5.5h15a3 3 0 0 1 3 3V24H8a3 3 0 0 1-3-3z"/><path d="M5 19.5a3 3 0 0 1 3-3h15M10 10h8M10 13h6"/></svg>',
  guide: '<svg viewBox="0 0 28 28" aria-hidden="true"><rect x="5" y="3" width="18" height="22" rx="2"/><path d="M9 9h10M9 14h7M9 19h5"/><path d="m17 19 2 2 4-4"/></svg>',
  clean: '<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M7 15h14v7a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2zM10 15V8h8v7M12 8V5h4v3"/><path d="M4 8V4M2 6h4M23 4v5M20.5 6.5h5"/></svg>',
  chat: '<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M14 3a11 11 0 0 0-9.6 16.4L3 25l5.8-1.5A11 11 0 1 0 14 3Z"/><path d="M8 11h12M8 15h9"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.5"/><path d="m16 16 5 5"/></svg>',
  info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/></svg>',
  external: '<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M7 21 21 7M11 7h10v10"/></svg>',
};

const categories = {
  videos: { label: "Tutoriais em vídeo", short: "Vídeos", description: "Aprenda a usar sua máquina com vídeos da TRES.", icon: icons.video },
  manual: { label: "Manual online", short: "Manual", description: "Consulte as instruções completas do seu modelo.", icon: icons.manual },
  guia: { label: "Guia rápido", short: "Guia rápido", description: "Encontre o essencial para começar e cuidar da máquina.", icon: icons.guide },
  limpeza: { label: "Como higienizar", short: "Higienização", description: "Veja os materiais de limpeza do seu modelo.", icon: icons.clean },
};

const models = {
  lov: {
    name: "LOV", image: "/ajuda/assets/lov.webp", product: "https://www.escolhatres.com.br/produto/maquinas/lov/",
    manual: "https://www.escolhatres.com.br/wp-content/uploads/2020/01/manual_lov.pdf",
    guide: "https://www.escolhatres.com.br/wp-content/uploads/2020/01/Guia_Rapido_LOV.pdf",
    videos: [
      { title: "Como usar a LOV", description: "Primeiros passos e preparo de bebidas.", id: "YcVrQou-9m0", terms: "usar primeira utilização bebida cápsula" },
      { title: "Como fazer a limpeza da LOV", description: "Limpeza da máquina mostrada em vídeo.", id: "TUre1TNoJnQ", terms: "limpeza higienização diária" },
      { title: "Limpeza interna da LOV", description: "Cuidados com o sistema interno da máquina.", id: "3JJlGySirt8", terms: "limpeza interna retrolavagem higienização" },
    ],
    cleaning: ["TUre1TNoJnQ", "3JJlGySirt8"],
  },
  modo: {
    name: "Modo", image: "/ajuda/assets/modo.webp", product: "https://www.escolhatres.com.br/produto/maquinas/modo/",
    manual: "https://www.escolhatres.com.br/wp-content/uploads/2020/01/manual_modo.pdf",
    guide: "https://www.escolhatres.com.br/wp-content/uploads/2020/01/guia_modo.pdf",
    videos: [
      { title: "Como usar a Modo", description: "Funcionamento e preparo de bebidas.", id: "FFCCzITZF3Y", terms: "usar primeira utilização bebida cápsula" },
    ],
    cleaning: [],
  },
  passione: {
    name: "Passione", image: "/ajuda/assets/passione.webp", product: "https://www.escolhatres.com.br/produto/maquinas/passione/",
    manual: "https://www.escolhatres.com.br/wp-content/uploads/2021/05/220207_TRES_169_Manual_PASSIONE_210x150_v8.pdf",
    guide: "https://www.escolhatres.com.br/wp-content/uploads/2021/05/201125_TRES_169_Guia_Rapido_Passione_16x16_V3.pdf",
    videos: [
      { title: "Conheça a Passione", description: "Apresentação da máquina e de seus recursos.", id: "5vHvztzlttg", terms: "conhecer recursos funcionamento" },
    ],
    cleaning: [],
  },
  luna: {
    name: "Luna", image: "/ajuda/assets/luna.webp", product: "https://www.escolhatres.com.br/produto/maquinas/luna/",
    manual: "https://www.escolhatres.com.br/wp-content/uploads/2023/12/231027_1086_TRES_Manual_NOVA_LUNA.pdf",
    guide: "https://www.escolhatres.com.br/wp-content/uploads/2023/12/230405_1086_TRES_Guia_Unico_NOVA_LUNA.pdf",
    videos: [
      { title: "Como funciona a Luna", description: "Conheça o uso da máquina.", id: "vE7eXD9__I0", terms: "usar primeira utilização funcionamento bebida" },
      { title: "Limpeza completa da Luna", description: "Cuidados completos apresentados em vídeo.", id: "5UCR-oEYKJs", terms: "limpeza completa higienização" },
      { title: "Limpeza diária da Luna", description: "Cuidados para a rotina de uso.", id: "4_APpxDSCv4", terms: "limpeza diária higienização" },
      { title: "Limpeza do bico de extração", description: "Vídeo específico para o bico da Luna.", id: "SsOypE_tndw", terms: "limpeza bico extração entupido" },
    ],
    cleaning: ["5UCR-oEYKJs", "4_APpxDSCv4", "SsOypE_tndw"],
  },
  touch: {
    name: "Touch", image: "/ajuda/assets/touch.webp", product: "https://www.escolhatres.com.br/produto/maquinas/touch/",
    manual: "https://www.escolhatres.com.br/wp-content/uploads/2020/10/200914_TRES_169_Manual_G2_Touch_210x150_AF.pdf",
    guide: "https://www.escolhatres.com.br/wp-content/uploads/2020/10/200624_TRES_169_Guia_Rapido_G2_Touch_18x18_AF.pdf",
    videos: [
      { title: "Guia rápido da Touch", description: "Visão geral de uso da máquina.", id: "IFx0KaFKPvE", terms: "usar guia rápido bebida funcionamento" },
      { title: "Conheça a Touch", description: "Apresentação dos recursos da máquina.", id: "eOplI_JbvTk", terms: "conhecer recursos funcionamento" },
    ],
    cleaning: [],
  },
};

const supportUrl = "https://www.escolhatres.com.br/central-de-ajuda/";
const requestedModel = new URLSearchParams(location.search).get("modelo")?.toLowerCase();
const qrModel = models[requestedModel] ? requestedModel : null;
function chatUrl(model = qrModel) {
  const url = new URL("/", location.origin);
  if (model) url.searchParams.set("modelo", model);
  return url.pathname + url.search;
}

function text(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function external(url, label, className = "") {
  return `<a class="${className}" href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

function currentRoute() {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (parts[0] === "chat" || parts[0] === "whatsapp") return { page: "chat" };
  if (parts[0] === "modelos" && categories[parts[1]]) return { page: "models", category: parts[1] };
  if (parts[0] === "conteudo" && categories[parts[1]] && models[parts[2]]) return { page: "content", category: parts[1], model: parts[2] };
  return { page: "home" };
}

const accents = {
  videos: { color: "var(--red)", text: "var(--red-soft)" },
  manual: { color: "var(--caramel)", text: "var(--caramel)" },
  guia: { color: "var(--green)", text: "var(--green)" },
  limpeza: { color: "var(--red)", text: "var(--red-soft)" },
};
const modelAccents = ["var(--red)", "var(--caramel)", "var(--green)", "var(--beige)", "var(--red)"];

function home() {
  return `
    <section class="landing-hero" aria-labelledby="home-title">
      <div class="hero-intro">
        <span class="hero-chip"><span aria-hidden="true">○ ○ ●</span> AJUDA TRES</span>
        <h1 id="home-title">Escaneou. <br><em>Resolveu.</em></h1>
        <p class="hero-description">A resposta para sua máquina está aqui. Escolha por onde começar.</p>
        ${qrModel ? `<p class="hero-model">Máquina: ${models[qrModel].name} · <a href="/ajuda#/">Trocar modelo</a></p>` : ""}
        <div class="hero-steps" aria-hidden="true"><span>QR NA MÁQUINA</span><i>→</i><span>AJUDA NO CELULAR</span></div>
      </div>
      <div class="hero-menu">
        <div class="hero-menu-bar"><h2>Como podemos ajudar?</h2><span aria-hidden="true">5 opções</span></div>
        <nav class="hero-options" aria-label="Opções de ajuda">
          <a class="hero-option is-primary" href="#/chat" aria-label="Conversar com o assistente virtual TRES">
            <span class="option-tile" aria-hidden="true">${icons.chat}</span>
            <span class="option-label">Conversar com assistente<span class="option-desc">Conte o que aconteceu com sua máquina</span></span>
            <span class="option-arrow" aria-hidden="true">→</span>
          </a>
          ${Object.entries(categories).map(([key, item]) => `
            <a class="hero-option${accents[key].color === "var(--red)" ? " tile-light" : ""}" style="--c:${accents[key].color}" href="${qrModel ? `#/conteudo/${key}/${qrModel}` : `#/modelos/${key}`}">
              <span class="option-tile" aria-hidden="true">${item.icon}</span>
              <span class="option-label">${item.label}<span class="option-desc">${item.description}</span></span>
              <span class="option-arrow" aria-hidden="true">→</span>
            </a>`).join("")}
        </nav>
        <p class="hero-menu-note">Não sabe o que procurar? Conte o problema ao assistente virtual.</p>
      </div>
    </section>
  `;
}

function modelPicker(category) {
  const item = categories[category];
  return `
    <section class="page-intro">
      <a class="back-link" href="#/">← Voltar às opções</a>
      <div class="eyebrow">${item.short}</div>
      <h1>Qual é a sua máquina?</h1>
      <p class="lead">Escolha o modelo para ver ${category === "limpeza" ? "os materiais de higienização correspondentes" : category === "videos" ? "os vídeos correspondentes" : category === "manual" ? "o manual correspondente" : "o guia rápido correspondente"}.</p>
      <div class="step-row"><span>Opção escolhida</span><span class="step-dot"></span><span class="active">Escolher máquina</span><span class="step-dot"></span><span>Ver conteúdo</span></div>
    </section>
    <nav class="model-grid" aria-label="Escolha o modelo da máquina">
      ${Object.entries(models).map(([key, model], index) => `
        <a class="model-card" style="--c:${modelAccents[index % modelAccents.length]}" href="#/conteudo/${category}/${key}" aria-label="Máquina ${model.name}">
          <span class="model-image"><img src="${model.image}" alt="Máquina TRES ${model.name}" loading="lazy" /></span>
          <span class="model-meta"><strong>${model.name}</strong><span aria-hidden="true">→</span></span>
        </a>`).join("")}
    </nav>
    <div class="hint-panel">${icons.info}<p><strong>Não sabe o modelo?</strong> Compare as fotos acima com sua máquina. O nome também pode estar no manual ou na etiqueta do aparelho. ${external(supportUrl, "Ver a Central de Ajuda TRES ↗")}</p></div>
  `;
}

function videoResource(video, type = "Vídeo") {
  return { title: video.title, description: video.description, type, url: `https://www.youtube.com/watch?v=${video.id}`, action: "Assistir no YouTube ↗", icon: icons.video, terms: video.terms, accent: "var(--red)", accentText: "var(--red-soft)" };
}

function resourceList(category, model) {
  const m = models[model];
  if (category === "manual") return [{ title: `Manual da ${m.name}`, description: "Instruções completas, avisos e cuidados específicos desta máquina.", type: "PDF oficial", url: m.manual, action: "Abrir manual ↗", icon: icons.manual, accent: "var(--caramel)", accentText: "var(--caramel)", terms: "manual instruções problemas manutenção" }];
  if (category === "guia") return [{ title: `Guia rápido da ${m.name}`, description: "Um resumo visual para começar a usar e cuidar da máquina.", type: "PDF oficial", url: m.guide, action: "Abrir guia rápido ↗", icon: icons.guide, accent: "var(--green)", accentText: "var(--green)", terms: "guia rápido primeira utilização bebida limpeza" }];
  if (category === "videos") return m.videos.map(v => videoResource(v));
  const videos = m.videos.filter(v => m.cleaning.includes(v.id)).map(v => videoResource(v, "Vídeo de higienização"));
  videos.push({ title: `Limpeza no manual da ${m.name}`, description: "Consulte as orientações de limpeza específicas do seu modelo.", type: "PDF oficial", url: m.manual, action: "Abrir manual ↗", icon: icons.manual, accent: "var(--caramel)", accentText: "var(--caramel)", terms: "limpeza higienização cuidado manutenção" });
  return videos;
}

function resourceCard(resource) {
  return `<a class="resource-card" style="--c:${resource.accent};--c-text:${resource.accentText}" href="${resource.url}" target="_blank" rel="noopener noreferrer">
    <div class="resource-card-top"><span class="resource-type">${text(resource.type)}</span><span class="mini-icon">${resource.icon}</span></div>
    <h2>${text(resource.title)}</h2><p>${text(resource.description)}</p><span class="resource-action">${text(resource.action)}</span>
  </a>`;
}

function contentPage(category, model) {
  const item = categories[category], m = models[model];
  const resources = resourceList(category, model);
  const emptyVideo = category === "limpeza" && m.cleaning.length === 0;
  return `
    <section class="page-intro">
      <div class="content-top"><a class="back-link" href="#/modelos/${category}">← Trocar de máquina</a><a class="model-pill" href="#/modelos/${category}" aria-label="Modelo ${m.name}, trocar máquina"><img src="${m.image}" alt="" />${m.name}<span aria-hidden="true">⌄</span></a></div>
      <div class="eyebrow">${item.short} · ${m.name}</div>
      <h1>${category === "limpeza" ? `Cuide da sua ${m.name}.` : category === "videos" ? `Veja como usar sua ${m.name}.` : category === "manual" ? `Manual da ${m.name}.` : `O essencial da ${m.name}.`}</h1>
      <p class="lead">${category === "limpeza" ? "Encontre os materiais oficiais de limpeza para este modelo." : category === "videos" ? "Escolha um vídeo para assistir no YouTube." : category === "manual" ? "Abra o manual oficial em PDF e consulte os detalhes da máquina." : "Abra o guia oficial em PDF para consultar os primeiros passos."}</p>
      <div class="step-row"><span>Opção escolhida</span><span class="step-dot"></span><span>${m.name}</span><span class="step-dot"></span><span class="active">Ver conteúdo</span></div>
    </section>
    <label class="search-box"><span class="sr-only">Buscar conteúdo da máquina ${m.name}</span>${icons.search}<input id="resource-search" type="search" placeholder="Buscar por assunto nesta página" autocomplete="off" /></label>
    <div class="resource-grid" id="resource-grid">${resources.map(resourceCard).join("")}</div>
    ${emptyVideo ? `<div class="notice">Ainda não localizamos um vídeo oficial de higienização específico da ${m.name}. Consulte a seção de limpeza no manual acima ou a ${external(supportUrl, "Central de Ajuda TRES ↗")}.</div>` : `<div class="notice">Siga as orientações do material do seu modelo. Em caso de vazamento, dano no cabo ou outro sinal de risco, interrompa o uso e procure ${external(supportUrl, "o atendimento TRES ↗")}.</div>`}
    <div class="chat-bridge"><strong>Ainda precisa de ajuda?</strong><p>O assistente já abre com a ${m.name} selecionada.</p><a href="${chatUrl(model)}">Conversar sobre a ${m.name} →</a></div>
  `;
}

function chatPage() {
  return `
    <section class="page-intro">
      <a class="back-link" href="#/">← Voltar às opções</a>
      <div class="eyebrow">Assistente virtual</div>
      <h1>Vamos conversar?</h1>
      <p class="lead">Conte o que aconteceu com sua máquina. O assistente busca uma orientação no fluxo de atendimento e nos manuais disponíveis.</p>
    </section>
    <div class="contact-panel">
      <h2>Converse com o assistente TRES</h2>
      <p>${qrModel ? `Sua máquina ${models[qrModel].name} já estará selecionada.` : "Escolha o modelo da máquina ao iniciar a conversa."}</p>
      <a href="${chatUrl()}">Abrir conversa →</a>
      ${external(supportUrl, "Ver Central de Ajuda ↗", "secondary-link")}
      <small>Protótipo de autoatendimento. Nenhum atendente real recebe as mensagens.</small>
    </div>
  `;
}

function render() {
  const route = currentRoute();
  app.innerHTML = route.page === "home" ? home() : route.page === "models" ? modelPicker(route.category) : route.page === "content" ? contentPage(route.category, route.model) : chatPage();
  document.title = `${route.page === "home" ? "Ajuda para sua máquina" : route.page === "models" ? "Escolha sua máquina" : route.page === "chat" ? "Assistente virtual" : `${categories[route.category].short} da ${models[route.model].name}`} | TRES`;
  if (route.page === "content") {
    const resources = resourceList(route.category, route.model);
    const input = document.querySelector("#resource-search");
    input.addEventListener("input", () => {
      const query = input.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      const found = resources.filter(resource => `${resource.title} ${resource.description} ${resource.terms}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(query));
      document.querySelector("#resource-grid").innerHTML = found.length ? found.map(resourceCard).join("") : `<div class="empty-state"><h2>Nenhum resultado nesta página.</h2><p>Tente outra palavra ou consulte o manual da máquina.</p></div>`;
    });
  }
  window.scrollTo({ top: 0, behavior: "auto" });
  app.focus({ preventScroll: true });
}

window.addEventListener("hashchange", render);
render();
