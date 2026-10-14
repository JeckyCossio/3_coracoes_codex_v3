import { FICHAS } from "../src/lib/fichas";

if (FICHAS.length !== 13 || new Set(FICHAS.map((f) => f.id)).size !== 13) {
  throw new Error("São necessárias 13 fichas com IDs únicos.");
}
for (const ficha of FICHAS) {
  if (!ficha.titulo || !ficha.passos.length || ficha.passos.some((p) => !p.texto)) {
    throw new Error(`Ficha ${ficha.id} incompleta`);
  }
  console.log(`${String(ficha.id).padStart(2, "0")} · ${ficha.titulo} · p. ${ficha.pagina}`);
}
