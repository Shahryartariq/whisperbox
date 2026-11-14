"use client";

import { useSyncExternalStore } from "react";

type Kind = "reply" | "question";
const KEY: Record<Kind, string> = { reply: "wb:last-reply", question: "wb:last-question" };
const listeners = new Set<() => void>();

/** Remember that this browser just sent an answer or created a question. */
export function markSent(kind: Kind) {
  try {
    localStorage.setItem(KEY[kind], String(Date.now()));
  } catch {
    // Storage can be blocked (private mode); the server still enforces the limit.
  }
  listeners.forEach((l) => l());
}

function secondsLeft(kind: Kind, seconds: number) {
  try {
    const last = Number(localStorage.getItem(KEY[kind]));
    if (!last) return 0;
    const left = Math.ceil((last + seconds * 1000 - Date.now()) / 1000);
    return left > 0 && left <= seconds ? left : 0;
  } catch {
    return 0;
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const t = setInterval(onChange, 1000);
  return () => {
    listeners.delete(onChange);
    clearInterval(t);
  };
}

/**
 * Seconds until this browser may send again (0 = ready). Mirrors the rate limit
 * in firestore.rules so people see a countdown instead of an error.
 */
export function useCooldown(kind: Kind, seconds: number) {
  return useSyncExternalStore(
    subscribe,
    () => secondsLeft(kind, seconds),
    () => 0,
  );
}
