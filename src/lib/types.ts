/**
 * Pile: shared types.
 *
 * The Convex schema is the source of truth; the types here mirror it.
 * Keep this file aligned with convex/schema.ts.
 */

export type ItemKind = "url" | "pdf" | "youtube";

export interface Chunk {
  id: string;            // stable, generated at chunking time
  itemId: string;
  charStart: number;
  charEnd: number;
  pageStart?: number;    // PDF only
  pageEnd?: number;      // PDF only
  text: string;
}

export interface Item {
  id: string;
  userId: string;
  kind: ItemKind;
  title: string;
  url?: string;          // canonical, tracking-stripped
  addedAt: number;
}

export type Speaker = "vega" | "theo";

export interface DialogueLine {
  id: string;            // stable, position in the script array
  episodeId: string;
  index: number;
  speaker: Speaker;
  text: string;
  citation?: {
    itemId: string;
    chunkId: string;
  };
}

export interface TimingMark {
  lineId: string;
  startMs: number;
  endMs: number;
}

export type EpisodeStatus =
  | "queued"
  | "generating"
  | "scripted"
  | "rendering"
  | "ready"
  | "failed";

export interface Episode {
  id: string;
  userId: string;
  status: EpisodeStatus;
  audioFileId?: string;  // Convex storage id
  durationMs?: number;
  waveform?: number[];   // 600 amplitude floats in [0, 1]
  createdAt: number;
  title?: string;
}

export type ReminderStatus = "pending" | "fired" | "dismissed";

export interface Reminder {
  id: string;
  userId: string;
  scheduledFor: number;   // UTC ms
  label: string;
  episodeId: string;
  audioAnchorMs: number;
  lineId?: string;
  chunkId?: string;
  chunkExcerpt?: string;  // denormalized for fast render
  status: ReminderStatus;
  createdAt: number;
}
