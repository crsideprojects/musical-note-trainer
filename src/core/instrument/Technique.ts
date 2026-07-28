// The minimal shared contract between the quiz engine and any instrument's
// technique model (cello fingering today; frets/valves/keys for a future
// instrument). Deliberately small — this is the entire "extensibility investment"
// for multi-instrument support, no plugin registry or dynamic loading.

import type { Pitch } from "../music/pitch";

export interface Technique<TAction> {
  /** Every action (fingering, fret, key, ...) that produces the given sounding pitch. */
  actionsForPitch(pitch: Pitch): TAction[];
  /** The pitch a given action produces — must round-trip with actionsForPitch. */
  pitchForAction(action: TAction): Pitch;
  /** Every action within the modeled range. Used for conformance checks and distractors. */
  allActions(): TAction[];
  formatAction(action: TAction): string;
}
