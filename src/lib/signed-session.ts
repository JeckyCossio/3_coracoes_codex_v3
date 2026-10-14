import { createHmac, timingSafeEqual } from "node:crypto";
import type { Conversation } from "./conversation";

const MAX_TOKEN_LENGTH = 60000;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters");
  return value;
}

export function signSession(state: Conversation): string {
  const payload = Buffer.from(JSON.stringify(state)).toString("base64url");
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function readSignedSession(token: unknown): Conversation | null {
  if (typeof token !== "string" || token.length > MAX_TOKEN_LENGTH) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest();
  let actual: Buffer;
  try { actual = Buffer.from(signature, "base64url"); } catch { return null; }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const state = JSON.parse(Buffer.from(payload, "base64url").toString()) as Conversation;
    if (!state || !/^[a-f0-9-]{36}$/i.test(state.id) || !Array.isArray(state.messages) ||
        typeof state.updatedAt !== "number" || Date.now() - state.updatedAt > MAX_AGE_MS ||
        state.updatedAt > Date.now() + 60000) return null;
    return state;
  } catch { return null; }
}
