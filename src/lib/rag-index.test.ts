import { describe, expect, it, vi } from "vitest";
import { embedTexts, validateIndex, validateModel } from "./rag-index";

describe("configuração RAG", () => {
  it("aceita somente os cinco modelos", () => {
    expect(validateModel("LOV")).toBe("LOV");
    expect(validateModel("Touch")).toBe("Touch");
    expect(() => validateModel("Mimo")).toThrow("fora do escopo");
  });

  it("rejeita índice com embedding integrado ou dimensão errada", async () => {
    const index = vi.fn();
    const describeIndex = vi.fn().mockResolvedValue({ status: { ready: true }, vectorType: "dense", dimension: 1536, metric: "cosine" });
    const pc = { describeIndex, index } as never;
    await validateIndex(pc, "tres-openai");
    expect(index).toHaveBeenCalledWith("tres-openai");
    describeIndex.mockResolvedValue({ status: { ready: true }, vectorType: "dense", dimension: 1024, metric: "cosine" });
    await expect(validateIndex(pc, "tres-openai")).rejects.toThrow("incompatível");
    describeIndex.mockResolvedValue({ status: { ready: true }, vectorType: "dense", dimension: 1536, metric: "cosine", embed: { model: "multilingual-e5-large" } });
    await expect(validateIndex(pc, "tres-openai")).rejects.toThrow("incompatível");
  });

  it("confere quantidade e tamanho dos embeddings", async () => {
    const create = vi.fn().mockResolvedValue({ data: [{ index: 0, embedding: Array(1536).fill(0.1) }] });
    const openai = { embeddings: { create } } as never;
    expect(await embedTexts(openai, ["dúvida"])) .toHaveLength(1);
    expect(create).toHaveBeenCalledWith({ model: "text-embedding-3-small", input: ["dúvida"], dimensions: 1536 });
    create.mockResolvedValue({ data: [{ index: 0, embedding: Array(1024).fill(0.1) }] });
    await expect(embedTexts(openai, ["dúvida"])).rejects.toThrow("Dimensão");
  });
});
