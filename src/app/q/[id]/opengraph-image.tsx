import { OG_SIZE, renderOgCard } from "@/lib/og";
import { getPublicQuestion } from "@/lib/server-question";

export const alt = "A question on Whisperbox";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = await getPublicQuestion(id);
  // A question's text never changes, so its image can be cached for a week.
  // The fallback card is cached only briefly in case the lookup failed.
  return renderOgCard(
    q.state === "found" ? q.text : "Ask anything. Read what people really think.",
    "Answer anonymously. No names, no sign-up.",
    q.state === "found" ? 604800 : 60,
  );
}
