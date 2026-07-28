import { useState } from "react";
import { ALL_CLEFS, CLEFS } from "../../core/music/clef";
import type { Accidental, Letter, Pitch } from "../../core/music/pitch";
import { ALL_LETTERS, formatPitch } from "../../core/music/pitch";
import { StaffRenderer } from "../../core/ui/StaffRenderer";
import { FingerboardDiagram } from "../../instruments/cello/FingerboardDiagram";
import { fingeringsForPitch } from "../../instruments/cello/technique";

export function ReferencePage() {
  const [letter, setLetter] = useState<Letter>("C");
  const [accidental, setAccidental] = useState<Accidental>(0);
  const [octave, setOctave] = useState(3);

  const pitch: Pitch = { letter, accidental, octave };
  const fingerings = fingeringsForPitch(pitch);

  return (
    <div className="page reference-page">
      <h1>Reference</h1>
      <p>Pick any note to see it on every clef and every place it's playable on the cello.</p>

      <div className="reference-controls">
        <label>
          Letter{" "}
          <select value={letter} onChange={(e) => setLetter(e.target.value as Letter)}>
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
            value={accidental}
            onChange={(e) => setAccidental(Number(e.target.value) as Accidental)}
          >
            <option value={-1}>Flat</option>
            <option value={0}>Natural</option>
            <option value={1}>Sharp</option>
          </select>
        </label>
        <label>
          Octave{" "}
          <select value={octave} onChange={(e) => setOctave(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
      </div>

      <h2>{formatPitch(pitch)}</h2>

      <div className="reference-staves">
        {ALL_CLEFS.map((clefId) => (
          <div key={clefId}>
            <p>{CLEFS[clefId].label}</p>
            <StaffRenderer clef={clefId} pitch={pitch} />
          </div>
        ))}
      </div>

      <h3>Cello fingerboard</h3>
      {fingerings.length === 0 ? (
        <p>This note is outside the modeled fingerboard range.</p>
      ) : (
        <>
          <p>{fingerings.length} way(s) to play this note.</p>
          <FingerboardDiagram highlighted={fingerings} />
        </>
      )}
    </div>
  );
}
