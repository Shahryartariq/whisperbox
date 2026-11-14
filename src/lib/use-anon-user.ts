"use client";

import type { User } from "firebase/auth";
import { useEffect, useState } from "react";

const CONNECT_ERROR =
  "Couldn't connect. Check your internet connection. We'll try again when you're back online.";

// One sign-in at a time for the whole page. Several components use this hook;
// without this, each would create its own anonymous account and the browser's
// ID could change mid-visit.
let signingIn: Promise<unknown> | null = null;

/**
 * Signs the browser in anonymously in the background. Nobody types anything;
 * the account only lets this browser manage the questions it created.
 * Firebase is loaded on demand so it doesn't slow down the first paint.
 */
export function useAnonUser() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let stop = () => {};
    let retry = () => {};
    const onOnline = () => retry();

    (async () => {
      const [{ firebase }, { onAuthStateChanged, signInAnonymously }] = await Promise.all([
        import("./firebase"),
        import("firebase/auth"),
      ]);
      if (cancelled) return;
      const { auth } = firebase();

      const signIn = () => {
        signingIn ??= signInAnonymously(auth).finally(() => {
          signingIn = null;
        });
        signingIn.then(
          () => !cancelled && setError(null),
          () => !cancelled && setError(CONNECT_ERROR),
        );
      };
      retry = () => {
        if (!auth.currentUser) signIn();
      };

      stop = onAuthStateChanged(auth, (u) => {
        if (u) {
          setUser(u);
          setError(null);
        } else {
          signIn();
        }
      });
    })().catch(() => !cancelled && setError(CONNECT_ERROR));

    window.addEventListener("online", onOnline);
    return () => {
      cancelled = true;
      stop();
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return { user, error };
}
