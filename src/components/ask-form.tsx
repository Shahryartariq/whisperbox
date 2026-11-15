"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { markSent, useCooldown } from "@/lib/cooldown";
import { describeWriteError, wasRefused } from "@/lib/errors";
import { HOME_IDEAS } from "@/lib/ideas";
import { QUESTION_COOLDOWN_SECONDS, QUESTION_MAX, QUESTION_MIN } from "@/lib/limits";
import { useAnonUser } from "@/lib/use-anon-user";

/**
 * Reads ?q= (set by "Ask this" on /ideas) and remounts the form when it changes,
 * so the idea lands in the box even if this page was kept alive in the background.
 */
export function AskFormWithIdea() {
  const idea = (useSearchParams().get("q") ?? "").slice(0, QUESTION_MAX);
  return <AskForm key={idea} initialText={idea} />;
}

export function AskForm({ initialText = "" }: { initialText?: string }) {
  const router = useRouter();
  const { user, error: authError } = useAnonUser();
  const [text, setText] = useState(initialText);
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One second more than the server's limit, to allow for clock differences.
  const wait = useCooldown("question", QUESTION_COOLDOWN_SECONDS + 1);

  const trimmed = text.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < QUESTION_MIN;
  const canSubmit =
    !!user && trimmed.length >= QUESTION_MIN && trimmed.length <= QUESTION_MAX && !busy && wait === 0;

  // Offline, Firestore keeps the question queued instead of failing, so say why it's taking long.
  useEffect(() => {
    if (!busy) return;
    const t = setTimeout(() => setSlow(true), 6000);
    return () => {
      clearTimeout(t);
      setSlow(false);
    };
  }, [busy]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const { createQuestion } = await import("@/lib/whisper");
      const id = await createQuestion(user.uid, trimmed);
      markSent("question");
      // Next.js keeps this page's state when you come back to it, so reset the
      // form now; otherwise the button stays stuck on "Creating your link…".
      setText("");
      setBusy(false);
      router.push(`/q/${id}?new=1`);
    } catch (err) {
      if (wasRefused(err)) markSent("question");
      setError(describeWriteError(err, "question"));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <label htmlFor="question" className="sr-only">
        Your question
      </label>
      <div className="slip rounded-sm bg-paper px-6 pb-4 pt-6 text-ink shadow-[0_18px_40px_-18px_rgb(0_0_0/0.7)] [--tilt:-0.6deg]">
        <textarea
          id="question"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
          }}
          maxLength={QUESTION_MAX}
          rows={3}
          placeholder="Who loves me?"
          className="w-full resize-none bg-transparent text-3xl font-bold leading-tight tracking-tight text-ink placeholder:text-ink/30 focus:outline-none sm:text-4xl"
        />
        <p className="mt-2 text-right text-sm text-ink/70" aria-live="polite">
          {tooShort ? `Write at least ${QUESTION_MIN} characters. ` : ""}
          {trimmed.length}/{QUESTION_MAX}
        </p>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Question ideas">
        {HOME_IDEAS.map((idea) => (
          <button
            key={idea}
            type="button"
            onClick={() => setText(idea)}
            className="rounded-full border border-haze/40 px-3.5 py-1.5 text-sm text-haze transition-colors hover:border-blush hover:text-paper"
          >
            {idea}
          </button>
        ))}
        <Link
          href="/ideas"
          className="rounded-full px-3.5 py-1.5 text-sm font-semibold text-paper underline underline-offset-4 hover:text-blush"
        >
          More question ideas
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-full bg-blush px-7 py-3.5 text-lg font-bold text-ink transition-colors hover:bg-blush-strong disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Creating your link…" : wait > 0 ? `Create another in ${wait}s` : "Create my link"}
        </button>
        {!user && !authError && <span className="text-sm text-haze">Connecting…</span>}
      </div>

      {slow && (
        <p className="text-sm text-haze" aria-live="polite">
          Waiting for your internet connection. Your link will be ready as soon as you&apos;re back online.
        </p>
      )}
      {(error || authError) && (
        <p role="alert" className="text-sm text-blush">
          {error ?? authError}
        </p>
      )}
    </form>
  );
}
