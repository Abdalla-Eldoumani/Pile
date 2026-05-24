// The demo page: player, transcript, and the source-excerpt panel that syncs
// to the audio. The interactive surface lives in EpisodeView (client).

import { EpisodeView } from "@/components/episode/EpisodeView";
import type { Id } from "@convex/_generated/dataModel";

type Params = Promise<{ id: string }>;

export default async function EpisodePage({ params }: { params: Params }) {
  const { id } = await params;
  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-10 md:py-16">
      <EpisodeView episodeId={id as Id<"episodes">} />
    </div>
  );
}
