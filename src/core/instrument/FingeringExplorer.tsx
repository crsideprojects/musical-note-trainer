import { useEffect, useState } from "react";
import type { Pitch } from "../music/pitch";
import { toMidi } from "../music/pitch";
import { StringFingerboardDiagram } from "./StringFingerboardDiagram";
import type { StringFingering, StringInstrumentEngine } from "./stringInstrumentEngine";

interface FingeringExplorerProps<TString extends string, TPosition extends string> {
  engine: StringInstrumentEngine<TString, TPosition>;
  instrumentLabel: string;
  pitch: Pitch;
}

function caption<TString extends string, TPosition extends string>(
  engine: StringInstrumentEngine<TString, TPosition>,
  fingering: StringFingering<TString, TPosition>,
): string {
  if (engine.isOpenFingering(fingering)) {
    return `Open ${fingering.string} string`;
  }
  const position = engine.positions.find((p) => p.name === fingering.position);
  const fingerLabel =
    fingering.finger === 0 && position?.usesThumb ? "thumb" : `finger ${fingering.finger}`;
  return `${fingering.string} string — ${fingering.position} position, ${fingerLabel}`;
}

/**
 * Steps through every valid fingering for a pitch (already ordered easiest
 * first by the engine — open string, then ascending position difficulty),
 * showing a compact single-row diagram for whichever one is selected. Shared
 * by the Reference page and Note ID's "how do I play this?" reveal.
 */
export function FingeringExplorer<TString extends string, TPosition extends string>({
  engine,
  instrumentLabel,
  pitch,
}: FingeringExplorerProps<TString, TPosition>) {
  const [index, setIndex] = useState(0);
  const fingerings = engine.fingeringsForPitch(pitch);

  // A new pitch should always start on its easiest fingering, not whatever
  // index was selected for the previous one.
  useEffect(() => {
    setIndex(0);
  }, [toMidi(pitch)]);

  if (fingerings.length === 0) {
    return <p className="fingering-explorer__empty">Outside the modeled fingerboard range.</p>;
  }

  const safeIndex = index % fingerings.length;
  const selected = fingerings[safeIndex];

  const rowFilter = (row: { position: TPosition; isOpenRow?: boolean }) =>
    engine.isOpenFingering(selected)
      ? row.isOpenRow === true
      : !row.isOpenRow && row.position === selected.position;

  function cycle(delta: number) {
    setIndex((i) => (i + delta + fingerings.length) % fingerings.length);
  }

  return (
    <div className="fingering-explorer">
      <div className="fingering-explorer__nav">
        {fingerings.length > 1 && (
          <button
            type="button"
            className="reference-card__step"
            onClick={() => cycle(-1)}
            aria-label="Previous fingering"
          >
            ‹
          </button>
        )}
        <span className="fingering-explorer__caption">{caption(engine, selected)}</span>
        {fingerings.length > 1 && (
          <span className="fingering-explorer__count">
            {safeIndex + 1}/{fingerings.length}
          </span>
        )}
        {fingerings.length > 1 && (
          <button
            type="button"
            className="reference-card__step"
            onClick={() => cycle(1)}
            aria-label="Next fingering"
          >
            ›
          </button>
        )}
      </div>
      <StringFingerboardDiagram
        engine={engine}
        instrumentLabel={instrumentLabel}
        highlighted={[selected]}
        rowFilter={rowFilter}
      />
    </div>
  );
}
