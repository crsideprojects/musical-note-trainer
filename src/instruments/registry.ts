import type { ClefId } from "../core/music/clef";
import { createNoteIdMode } from "../core/instrument/modes/createNoteIdMode";
import type { QuizModeConfig } from "../core/quiz/QuizModeConfig";
import type { StringInstrumentEngine } from "../core/instrument/stringInstrumentEngine";
import { celloEngine } from "./cello/technique";
import { violinEngine } from "./violin/technique";

export interface InstrumentDef {
  id: string;
  label: string;
  clefs: ClefId[];
  // Each instrument's mode closes over a differently-typed engine (CelloFingering
  // vs ViolinFingering), so the registry necessarily erases that to `any` to hold
  // them in one heterogeneous list — QuizRunner and the mode's own factory stay
  // fully generic/type-safe; only this shared collection type loses precision.
  modes: {
    noteId: QuizModeConfig<any, any>;
  };
  engine: StringInstrumentEngine<any, any>;
}

const celloInstrument: InstrumentDef = {
  id: "cello",
  label: "Cello",
  clefs: ["bass", "tenor", "treble"],
  modes: {
    noteId: createNoteIdMode(celloEngine, "cello", "Cello", ["bass", "tenor", "treble"]),
  },
  engine: celloEngine,
};

const violinInstrument: InstrumentDef = {
  id: "violin",
  label: "Violin",
  clefs: ["treble"],
  modes: {
    noteId: createNoteIdMode(violinEngine, "violin", "Violin", ["treble"]),
  },
  engine: violinEngine,
};

export const INSTRUMENTS: InstrumentDef[] = [celloInstrument, violinInstrument];

export function getInstrument(id: string): InstrumentDef {
  return INSTRUMENTS.find((i) => i.id === id) ?? INSTRUMENTS[0];
}
