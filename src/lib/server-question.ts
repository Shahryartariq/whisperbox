import "server-only";
import { cache } from "react";
import { ID_PATTERN } from "./limits";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-whisperbox";
const base =
  process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === "true"
    ? "http://127.0.0.1:8080/v1"
    : "https://firestore.googleapis.com/v1";

export type PublicQuestion =
  | { state: "found"; text: string; open: boolean }
  | { state: "missing" }
  // The lookup itself failed (network, quota). The question may well exist,
  // so the page must not claim it doesn't.
  | { state: "unknown" };

/**
 * Reads a question over Firestore's REST API (questions are publicly readable),
 * for page metadata and link-preview images.
 */
export const getPublicQuestion = cache(async (id: string): Promise<PublicQuestion> => {
  if (!ID_PATTERN.test(id)) return { state: "missing" };
  try {
    const res = await fetch(
      `${base}/projects/${projectId}/databases/(default)/documents/questions/${id}`,
      { cache: "no-store", signal: AbortSignal.timeout(4000) },
    );
    if (res.status === 404) return { state: "missing" };
    if (!res.ok) return { state: "unknown" };
    const json = await res.json();
    const text = json?.fields?.text?.stringValue;
    if (typeof text !== "string") return { state: "unknown" };
    return { state: "found", text, open: json.fields.open?.booleanValue !== false };
  } catch {
    return { state: "unknown" };
  }
});
