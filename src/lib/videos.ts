import { normalizar, type Modelo } from "./fichas";

type Video = { modelo: Modelo; url: string; titulo: string; topic: "uso" | "limpeza" | "limpeza_interna" | "bico" };

// Vídeos do catálogo público usado em /ajuda. A escolha por modelo e assunto é determinística.
export const VIDEO_CATALOG: Video[] = [
  { modelo: "LOV", topic: "uso", titulo: "Como usar a LOV", url: "https://www.youtube.com/watch?v=YcVrQou-9m0" },
  { modelo: "LOV", topic: "limpeza", titulo: "Como fazer a limpeza da LOV", url: "https://www.youtube.com/watch?v=TUre1TNoJnQ" },
  { modelo: "LOV", topic: "limpeza_interna", titulo: "Limpeza interna da LOV", url: "https://www.youtube.com/watch?v=3JJlGySirt8" },
  { modelo: "Modo", topic: "uso", titulo: "Como usar a Modo", url: "https://www.youtube.com/watch?v=FFCCzITZF3Y" },
  { modelo: "Modo", topic: "limpeza_interna", titulo: "Limpeza interna da Modo", url: "https://www.youtube.com/watch?v=hzRPm6v9c_M" },
  { modelo: "Passione", topic: "uso", titulo: "Conheça a Passione", url: "https://www.youtube.com/watch?v=5vHvztzlttg" },
  { modelo: "Luna", topic: "uso", titulo: "Como funciona a Luna", url: "https://www.youtube.com/watch?v=vE7eXD9__I0" },
  { modelo: "Luna", topic: "limpeza", titulo: "Limpeza diária da Luna", url: "https://www.youtube.com/watch?v=4_APpxDSCv4" },
  { modelo: "Luna", topic: "limpeza_interna", titulo: "Limpeza completa da Luna", url: "https://www.youtube.com/watch?v=5UCR-oEYKJs" },
  { modelo: "Luna", topic: "bico", titulo: "Limpeza do bico de extração da Luna", url: "https://www.youtube.com/watch?v=SsOypE_tndw" },
  { modelo: "Touch", topic: "uso", titulo: "Guia rápido da Touch", url: "https://www.youtube.com/watch?v=IFx0KaFKPvE" },
  { modelo: "Touch", topic: "uso", titulo: "Conheça a Touch", url: "https://www.youtube.com/watch?v=eOplI_JbvTk" }
];

function safeVideo(video: Video | undefined) {
  if (!video) return null;
  const url = new URL(video.url);
  return url.protocol === "https:" && url.hostname === "www.youtube.com" && url.pathname === "/watch" ? video : null;
}

export function videoFor(fichaId: number, modelo?: Modelo) {
  if (!modelo) return null;
  const topic = fichaId === 12 && modelo === "Luna" ? "bico"
    : fichaId === 6 && ["LOV", "Modo"].includes(modelo) ? "limpeza_interna"
    : null;
  return safeVideo(VIDEO_CATALOG.find((video) => video.modelo === modelo && video.topic === topic));
}

export function videoForQuestion(modelo: Modelo, question: string) {
  const text = normalizar(question);
  const topic = /\b(bico|entupido|extracao)\b/.test(text) ? "bico"
    : /\b(interna|internamente|retrolavagem|completa)\b/.test(text) ? "limpeza_interna"
    : /\b(limpar|limpeza|higienizar|higienizacao)\b/.test(text) ? "limpeza"
    : "uso";
  const exact = VIDEO_CATALOG.find((video) => video.modelo === modelo && video.topic === topic);
  const fallback = topic === "limpeza" ? VIDEO_CATALOG.find((video) => video.modelo === modelo && video.topic === "limpeza_interna") : undefined;
  return safeVideo(exact || fallback);
}
