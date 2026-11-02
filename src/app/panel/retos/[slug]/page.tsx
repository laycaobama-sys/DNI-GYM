import { CHALLENGES } from "@/data/challenges";
import { ChallengeView } from "./challenge-view";

export function generateStaticParams() {
  return CHALLENGES.map((c) => ({ slug: c.slug }));
}

export default async function PanelChallengePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ChallengeView slug={slug} />;
}
