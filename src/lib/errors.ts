import { QUESTION_COOLDOWN_SECONDS, REPLY_COOLDOWN_SECONDS } from "./limits";

const codeOf = (e: unknown) =>
  typeof e === "object" && e !== null && "code" in e ? String((e as { code: unknown }).code) : "";

/** Turns a failed Firestore write into a message that says what actually happened. */
export function describeWriteError(e: unknown, kind: "question" | "reply" | "manage"): string {
  const code = codeOf(e);
  if (code === "permission-denied") {
    if (kind === "reply")
      return `You're sending answers too quickly. Wait ${REPLY_COOLDOWN_SECONDS} seconds and try again.`;
    if (kind === "question")
      return `You can create one question every ${QUESTION_COOLDOWN_SECONDS} seconds. Wait a moment and try again.`;
    return "Only the browser that asked this question can change it.";
  }
  if (code === "resource-exhausted")
    return "Whisperbox is very busy right now. Try again in a few minutes.";
  if (code === "unavailable" || code === "deadline-exceeded" || code === "cancelled")
    return "No connection. Check your internet and try again.";
  if (code === "not-found") return "This question no longer exists.";
  return "That didn't work. Try again.";
}

/** Message for a failed live listener (question or answers). */
export function describeReadError(e: unknown, what: "question" | "answers"): string {
  if (codeOf(e) === "resource-exhausted")
    return "Whisperbox is very busy right now. Try again in a few minutes.";
  return `Couldn't load ${what === "question" ? "this question" : "the answers"}. Check your internet and reload the page.`;
}

/** True when the error means the write was refused, not that the network failed. */
export const wasRefused = (e: unknown) => codeOf(e) === "permission-denied";
