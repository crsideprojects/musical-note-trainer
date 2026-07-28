import { useEffect, useState } from "react";
import { useInstrument } from "../InstrumentContext";
import { CLEFS } from "../../core/music/clef";
import type { Accidental, Letter, Pitch } from "../../core/music/pitch";
import { ALL_LETTERS, enharmonicsOf, formatPitch, spellingsForMidi, toMidi } from "../../core/music/pitch";
import { StaffRenderer } from "../../core/ui/StaffRenderer";
import { StringFingerboardDiagram } from "../../core/instrument/StringFingerboardDiagram";

const MIN_MIDI = toMidi({ letter: "C", accidental: -1, octave: 1 });
const MAX_MIDI = toMidi({ letter: "B", accidental: 1, octave: 6 });

function canonicalSpelling(midi: number): Pitch {
  const spellings = spellingsForMidi(midi);
  return spellings.find((p) => p.accidental === 0) ?? spellings[0];
}

function stepPitch(pitch: Pitch, delta: number): Pitch {
  const clamped = Math.min(MAX_MIDI, Math.max(MIN_MIDI, toMidi(pitch) + delta));
  return canonicalSpelling(clamped);
}

export function ReferencePage() {
  const { instrument } = useInstrument();
  const [pitch, setPitch] = useState<Pitch>({ letter: "C", accidental: 0, octave: 3 });
  const [fingeringIndex, setFingeringIndex] = useState(0);

  const fingerings = instrument.engine.fingeringsForPitch(pitch);
  const enharmonics = enharmonicsOf(pitch);

  // A new card should always start on its first fingering, not whatever index
  // was selected on the previous note.
  useEffect(() => {
    setFingeringIndex(0);
  }, [toMidi(pitch)]);

  const safeIndex = fingerings.length > 0 ? fingeringIndex % fingerings.length : 0;
  const selectedFingering = fingerings[safeIndex];

  const rowFilter = selectedFingering
    ? (row: { position: string; isOpenRow?: boolean }) =>
        instrument.engine.isOpenFingering(selectedFingering)
          ? row.isOpenRow === true
          : !row.isOpenRow && row.position === selectedFingering.position
    : undefined;

  function cycleFingering(delta: number) {
    setFingeringIndex((i) => (i + delta + fingerings.length) % fingerings.length);
  }

  return (
    <div className="page reference-page">
      <h1>Reference</h1>
      <p>
        Flip through notes to see how each is written on{" "}
        {instrument.clefs.length > 1 ? "every clef" : "the clef"} the{" "}
        {instrument.label.toLowerCase()} reads, its enharmonic spelling, and where it's played
        on the fingerboard.
      </p>

      <div className="reference-controls">
        <label>
          Letter{" "}
          <select
            value={pitch.letter}
            onChange={(e) => setPitch({ ...pitch, letter: e.target.value as Letter })}
          >
            {ALL_LETTERS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          Accidental{" "}
          <select
            value={pitch.accidental}
            onChange={(e) =>
              setPitch({ ...pitch, accidental: Number(e.target.value) as Accidental })
            }
          >
            <option value={-1}>Flat</option>
            <option value={0}>Natural</option>
            <option value={1}>Sharp</option>
          </select>
        </label>
        <label>
          Octave{" "}
          <select
            value={pitch.octave}
            onChange={(e) => setPitch({ ...pitch, octave: Number(e.target.value) })}
          >
            {[1, 2, 3, 4, 5, 6].map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="reference-card">
        <div className="reference-card__nav">
          <button
            type="button"
            className="reference-card__step"
            onClick={() => setPitch(stepPitch(pitch, -1))}
            aria-label="Previous note"
          >
            ‹
          </button>
          <h2>{formatPitch(pitch)}</h2>
          <button
            type="button"
            className="reference-card__step"
            onClick={() => setPitch(stepPitch(pitch, 1))}
            aria-label="Next note"
          >
            ›
          </button>
        </div>

        <p className="reference-card__enharmonic">
          {enharmonics.length > 0
            ? `Also written: ${enharmonics.map(formatPitch).join(", ")}`
            : "No common enharmonic spelling"}
        </p>

        <div className="reference-staves">
          {instrument.clefs.map((clefId) => (
            <div key={clefId} className="reference-staff">
              <p>{CLEFS[clefId].label}</p>
              <StaffRenderer clef={clefId} pitch={pitch} />
            </div>
          ))}
        </div>

        <div className="reference-fingering">
          <h3>{instrument.label} fingering</h3>
          {fingerings.length === 0 || !selectedFingering ? (
            <p>This note is outside the modeled fingerboard range.</p>
          ) : (
            <>
              <div className="reference-fingering__nav">
                <button
                  type="button"
                  className="reference-card__step"
                  disabled={fingerings.length <= 1}
                  onClick={() => cycleFingering(-1)}
                  aria-label="Previous fingering"
                >
                  ‹
                </button>
                <span>
                  Fingering {safeIndex + 1} of {fingerings.length}:{" "}
                  {instrument.engine.formatFingering(selectedFingering)}
                </span>
                <button
                  type="button"
                  className="reference-card__step"
                  disabled={fingerings.length <= 1}
                  onClick={() => cycleFingering(1)}
                  aria-label="Next fingering"
                >
                  ›
                </button>
              </div>
              <StringFingerboardDiagram
                engine={instrument.engine}
                instrumentLabel={instrument.label}
                highlighted={[selectedFingering]}
                rowFilter={rowFilter}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
