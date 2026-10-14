import { loadEnvConfig } from "@next/env";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { MODELOS } from "../src/lib/fichas";
import { clients, embedTexts, EMBEDDING_MODEL, validateIndex } from "../src/lib/rag-index";

loadEnvConfig(process.cwd());
const root = join(process.cwd(), "data", "manuais");
type Chunk = { text: string; page?: number; section?: string };

function splitSections(text: string, page?: number): Chunk[] {
  const lines = text.replace(/\r/g, "").split("\n");
  const sections: Chunk[] = [];
  let title = "Introdução";
  let paragraphs: string[] = [];
  const flush = () => {
    const content = paragraphs.join("\n").trim();
    if (content.length >= 60) sections.push({ text: `${title}\n${content}`, page, section: title });
    paragraphs = [];
  };
  for (const line of lines) {
    const trimmed = line.trim();
    const heading = /^#{1,6}\s+/.test(trimmed) || (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ][^.!?]{2,75}$/.test(trimmed) && !/^\d+[.)]\s/.test(trimmed));
    if (heading) { flush(); title = trimmed.replace(/^#+\s*/, ""); }
    else if (trimmed) paragraphs.push(trimmed);
    else if (paragraphs.length && paragraphs.at(-1) !== "") paragraphs.push("");
  }
  flush();
  const chunks: Chunk[] = [];
  for (const section of sections) {
    if (section.text.length <= 3000) { chunks.push(section); continue; }
    const blocks = section.text.split(/\n\s*\n/).filter(Boolean);
    let current = "";
    for (const block of blocks) {
      if (current && current.length + block.length > 3000) { chunks.push({ ...section, text: current.trim() }); current = `${section.section}\n`; }
      // An oversized procedure stays whole; embeddings accept more than this preferred chunk size.
      current += `${block}\n\n`;
    }
    if (current.trim().length >= 60) chunks.push({ ...section, text: current.trim() });
  }
  return chunks;
}

function extract(filePath: string): Chunk[] {
  const extension = extname(filePath).toLowerCase();
  if (extension === ".pdf") {
    const raw = execFileSync("pdftotext", ["-layout", filePath, "-"], { encoding: "utf8", maxBuffer: 30_000_000 });
    if (raw.replace(/\s/g, "").length < 60) throw new Error(`PDF sem texto extraível (precisa de OCR): ${filePath}`);
    return raw.split("\f").flatMap((page, i) => splitSections(page, i + 1));
  }
  return splitSections(readFileSync(filePath, "utf8"));
}

async function main() {
  const { openai, pinecone, indexName } = clients();
  const index = await validateIndex(pinecone, indexName);
  console.log(`Índice ${indexName} validado: dense, cosine, 1536 dimensões, embedding externo.`);
  for (const model of MODELOS) {
    const namespace = model.toLowerCase();
    const dir = join(root, namespace);
    if (!existsSync(dir)) { console.log(`${namespace}: sem pasta de manuais`); continue; }
    const files = readdirSync(dir).filter((file) => /\.(pdf|txt|md)$/i.test(file));
    for (const file of files) {
      const path = join(dir, file);
      const chunks = extract(path);
      if (!chunks.length) throw new Error(`Documento sem trechos válidos: ${path}`);
      const prefix = createHash("sha256").update(`${namespace}/${file}`).digest("hex").slice(0, 20);
      const records = chunks.map((chunk, i) => ({
        id: `${prefix}-${String(i).padStart(5, "0")}`,
        metadata: { modelo: namespace, arquivo: basename(file), tipo_documento: extname(file).slice(1).toLowerCase(), pagina: chunk.page || 0, secao: chunk.section || "", texto: chunk.text, embedding_model: EMBEDDING_MODEL, versao: "mvp-1" }
      }));
      const ns = index.namespace(namespace);
      // Read existing IDs first. Delete stale IDs only after every new batch is stored.
      const previous: string[] = [];
      let paginationToken: string | undefined;
      do {
        const listed = await ns.listPaginated({ prefix, limit: 100, ...(paginationToken ? { paginationToken } : {}) });
        previous.push(...(listed.vectors || []).map((item) => item.id).filter((id): id is string => typeof id === "string"));
        paginationToken = listed.pagination?.next;
      } while (paginationToken);
      for (let i = 0; i < records.length; i += 20) {
        const batch = records.slice(i, i + 20);
        const vectors = await embedTexts(openai, batch.map((record) => record.metadata.texto));
        await ns.upsert(batch.map((record, j) => ({ id: record.id, values: vectors[j], metadata: record.metadata })));
      }
      const current = new Set(records.map((record) => record.id));
      const stale = previous.filter((id) => !current.has(id));
      for (let i = 0; i < stale.length; i += 100) await ns.deleteMany(stale.slice(i, i + 100));
      console.log(`${namespace}/${file}: ${records.length} trechos, ${stale.length} obsoletos removidos`);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Falha na ingestão.");
  process.exitCode = 1;
});
