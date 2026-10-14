import type { Modelo } from "./fichas";

// Preencha somente depois de verificar que cada link corresponde ao modelo e à ficha.
export const VIDEO_CATALOG: Array<{ fichaId: number; modelo?: Modelo; url: string; titulo: string }> = [];

export function videoFor(fichaId: number, modelo?: Modelo) {
  const item = VIDEO_CATALOG.find((v) => v.fichaId === fichaId && (!v.modelo || v.modelo === modelo));
  if (!item) return null;
  try { return new URL(item.url).protocol === "https:" ? item : null; } catch { return null; }
}
