import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import { MODELOS, type Modelo } from "./fichas";

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;

export function requireConfig(name: "OPENAI_API_KEY" | "PINECONE_API_KEY" | "PINECONE_INDEX") {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Configuração ausente: ${name}.`);
  return value;
}

export function validateModel(value: string): Modelo {
  if (!MODELOS.includes(value as Modelo)) throw new Error(`Modelo fora do escopo: ${value}.`);
  return value as Modelo;
}

export function clients() {
  return {
    openai: new OpenAI({ apiKey: requireConfig("OPENAI_API_KEY"), timeout: 15000, maxRetries: 3 }),
    pinecone: new Pinecone({ apiKey: requireConfig("PINECONE_API_KEY") }),
    indexName: requireConfig("PINECONE_INDEX")
  };
}

export async function validateIndex(pinecone: Pinecone, indexName: string) {
  const index = await pinecone.describeIndex(indexName);
  if (!index.status.ready || index.vectorType !== "dense" || index.dimension !== EMBEDDING_DIMENSIONS || index.metric !== "cosine" || index.embed) {
    throw new Error(`Índice ${indexName} incompatível: exige dense, cosine, 1536 dimensões, pronto e sem embedding integrado.`);
  }
  return pinecone.index(indexName);
}

export async function embedTexts(openai: OpenAI, texts: string[]) {
  if (!texts.length) return [];
  const response = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: texts, dimensions: EMBEDDING_DIMENSIONS });
  const ordered = [...response.data].sort((a, b) => a.index - b.index).map((item) => item.embedding);
  if (ordered.length !== texts.length || ordered.some((vector) => vector.length !== EMBEDDING_DIMENSIONS)) {
    throw new Error("Dimensão ou quantidade de embeddings incompatível com o índice Pinecone.");
  }
  return ordered;
}
