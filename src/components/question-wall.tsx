"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { describeReadError } from "@/lib/errors";
import { REPLY_PAGE } from "@/lib/limits";
import { REPO_URL } from "@/lib/site";
import { useAnonUser } from "@/lib/use-anon-user";
import type { Question, Reply } from "@/lib/whisper";
import { ReplyForm } from "./reply-form";
import { SharePanel } from "./share-panel";
import { Wall } from "./wall";

export function QuestionWall({ id, initialText }: { id: string; initialText: string }) {
  const { user, error: authError } = useAnonUser();
  // Read ?new=1 once, then drop it from the address bar so a copied URL is clean.
  const params = useSearchParams();
  const [isNew] = useState(() => params.get("new") === "1");
  useEffect(() => {
    if (isNew) window.history.replaceState(null, "", `/q/${id}`);
  }, [isNew, id]);

  // undefined = still loading, null = deleted
  const [question, setQuestion] = useState<Question | null | undefined>(undefined);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reading is public, so this doesn't wait for the anonymous sign-in:
  // answers still load when sign-in is slow or blocked.
  useEffect(() => {
    let cancelled = false;
    let stop: (() => void)[] = [];
    import("@/lib/whisper")
      .then((w) => {
        if (cancelled) return;
        stop = [
          w.watchQuestion(id, setQuestion, (e) => setError(describeReadError(e, "question"))),
          w.watchReplies(
            id,
            (r) => {
              setReplies(r);
              setRepliesLoaded(true);
            },
            (e) => setError(describeReadError(e, "answers")),
          ),
        ];
      })
      .catch(() => !cancelled && setError(describeReadError(null, "question")));
    return () => {
      cancelled = true;
      stop.forEach((off) => off());
    };
  }, [id]);

  if (question === null) {
    return (
      <div className="py-10">
        <h1 className="text-3xl font-extrabold">This question was deleted.</h1>
        <p className="mt-3 text-haze">The person who asked it removed it along with its answers.</p>
        <Link href="/" className="mt-6 inline-block font-bold text-blush underline underline-offset-4">
          Ask your own question
        </Link>
      </div>
    );
  }

  const isOwner = !!user && !!question && question.ownerUid === user.uid;
  const open = question?.open ?? true;
  const count = replies.length;
  const countLabel = count >= REPLY_PAGE ? `${REPLY_PAGE}+ answers` : `${count} ${count === 1 ? "answer" : "answers"}`;
  // Until we know both the question and who this browser is, we can't tell the
  // asker from a visitor, so show neither the share panel nor the answer box.
  const deciding = !question || (!user && !authError);

  return (
    <article>
      <h1 className="text-4xl font-extrabold leading-[1.02] tracking-tight [font-variation-settings:'wdth'_78] sm:text-6xl">
        {question?.text ?? (initialText || "Loading question…")}
      </h1>
      <p className="mt-3 text-haze">
        {repliesLoaded ? countLabel : " "}
        {repliesLoaded && question && !open && ". Closed to new answers."}
      </p>

      <div className={deciding ? "mt-8 min-h-44" : "mt-8"}>
        {deciding ? null : isOwner && question ? (
          <SharePanel question={question} isNew={isNew} />
        ) : !open ? (
          <p className="rounded-lg border border-haze/30 px-5 py-4 text-haze">
            This question isn&apos;t taking answers anymore.{" "}
            <Link href="/" className="font-semibold text-blush underline underline-offset-4">
              Ask your own
            </Link>
          </p>
        ) : user ? (
          <ReplyForm questionId={id} uid={user.uid} />
        ) : null}
      </div>

      {(error || authError) && (
        <p role="alert" className="mt-4 text-sm text-blush">
          {error ?? `${authError} You can still read the answers.`}
        </p>
      )}

      <section aria-label="Answers" className="mt-12">
        <Wall questionId={id} replies={replies} loaded={repliesLoaded} isOwner={isOwner} />
        {count >= REPLY_PAGE && (
          <p className="mt-2 text-sm text-haze">Showing the latest {REPLY_PAGE} answers.</p>
        )}
      </section>

      {question && !deciding && !isOwner && (
        <p className="mt-16 text-sm text-haze">
          Something wrong with this question?{" "}
          <a
            href={`${REPO_URL}/issues/new?title=${encodeURIComponent(`Report: question ${id}`)}&body=${encodeURIComponent("What's wrong with this question or its answers?\n\n")}`}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-paper"
          >
            Report it
          </a>
        </p>
      )}
    </article>
  );
}
