"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { markSent, useCooldown } from "@/lib/cooldown";
import { describeWriteError, wasRefused } from "@/lib/errors";
import { REPLY_COOLDOWN_SECONDS, REPLY_MAX } from "@/lib/limits";

export function ReplyForm({ questionId, uid }: { questionId: string; uid: string | null }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One second more than the server's limit, to allow for clock differences.
  const wait = useCooldown("reply", REPLY_COOLDOWN_SECONDS + 1);

  const trimmed = text.trim();
  const canSend = !!uid && trimmed.length > 0 && trimmed.length <= REPLY_MAX && !busy && wait === 0;

  // Offline, Firestore keeps the answer queued instead of failing, so say why it's taking long.
  useEffect(() => {
    if (!busy) return;
    const t = setTimeout(() => setSlow(true), 6000);
    return () => {
      clearTimeout(t);
      setSlow(false);
    };
  }, [busy]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!uid || !canSend) return;
    setBusy(true);
    setError(null);
    try {
      const { addReply } = await import("@/lib/whisper");
      await addReply(uid, questionId, trimmed);
      markSent("reply");
      setText("");
      setSent(true);
    } catch (err) {
      if (wasRefused(err)) markSent("reply");
      setError(describeWriteError(err, "reply"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={send} className="space-y-3">
      <label htmlFor="answer" className="sr-only">
        Your answer
      </label>
      <textarea
        id="answer"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSent(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
        }}
        maxLength={REPLY_MAX}
        rows={3}
        placeholder="Write your answer. Nobody will know it's you."
        className="w-full resize-none rounded-md border border-haze/30 bg-dusk-deep/70 px-4 py-3 text-lg text-paper placeholder:text-haze/60 focus:border-blush focus:outline-none"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="submit"
          disabled={!canSend}
          className="rounded-full bg-blush px-6 py-3 font-bold text-ink transition-colors hover:bg-blush-strong disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Sending…" : wait > 0 ? `Send another in ${wait}s` : "Send anonymously"}
        </button>
        <span className="text-sm text-haze">
          {!uid ? "Connecting… " : ""}
          {trimmed.length}/{REPLY_MAX}
        </span>
      </div>
      <div aria-live="polite" className="min-h-5">
        {slow && (
          <p className="text-sm text-haze">
            Waiting for your internet connection. Your answer will send as soon as you&apos;re back online.
          </p>
        )}
        {sent && !busy && (
          <p className="text-sm text-paper">
            Sent. Your answer is on the wall with no name on it.{" "}
            <Link href="/" className="font-semibold text-blush underline underline-offset-4">
              Ask your own question
            </Link>
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-blush">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
