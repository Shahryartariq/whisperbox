import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { QuestionWall } from "@/components/question-wall";
import { getPublicQuestion } from "@/lib/server-question";

export async function generateMetadata({ params }: PageProps<"/q/[id]">): Promise<Metadata> {
  const { id } = await params;
  const q = await getPublicQuestion(id);
  // Questions are personal user content: keep them out of search results, but
  // let link previews (WhatsApp, Instagram, X) show the question.
  const robots = { index: false, follow: true };
  if (q.state === "missing") return { title: "Question not found", robots };
  const title = q.state === "found" ? q.text : "A question for you";
  const description = "Answer anonymously. No sign-up, and no name attached.";
  return {
    title,
    description,
    robots,
    alternates: { canonical: `/q/${id}` },
    openGraph: { title, description, url: `/q/${id}`, type: "website", siteName: "Whisperbox" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function QuestionPage({ params }: PageProps<"/q/[id]">) {
  return (
    <Suspense fallback={<p className="text-haze">Loading question…</p>}>
      <Question params={params} />
    </Suspense>
  );
}

async function Question({ params }: Pick<PageProps<"/q/[id]">, "params">) {
  const { id } = await params;
  const q = await getPublicQuestion(id);
  if (q.state === "missing") notFound();
  // If the lookup failed, still render the wall: the browser loads the question itself.
  return <QuestionWall id={id} initialText={q.state === "found" ? q.text : ""} />;
}
