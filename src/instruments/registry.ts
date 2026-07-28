import type { ClefId } from "../core/music/clef";
import { enharmonicsMode } from "../core/modes/enharmonicsMode";
import { createNoteIdMode } from "../core/modes/noteIdMode";
import { createFingeringMode } from "../core/instrument/modes/createFingeringMode";
import { createSameNoteMode } from "../core/instrument/modes/createSameNoteMode";
import type { QuizModeConfig } from "../core/quiz/QuizModeConfig";
import type { StringInstrumentEngine } from "../core/instrument/stringInstrumentEngine";
import { celloEngine } from "./cello/technique";
import { violinEngine } from "./violin/technique";

export interface InstrumentDef {
  id: string;
  label: string;
  clefs: ClefId[];
  // Each instrument's modes close over a differently-typed engine (CelloFingering
  // vs ViolinFingering), so the registry necessarily erases that to `any` to hold
  // them in one heterogeneous list — QuizRunner and each mode's own factory stay
  // fully generic/type-safe; only this shared collection type loses precision.
  modes: {
    noteId: QuizModeConfig<any, any>;
    enharmonics: QuizModeConfig<any, any>;
    fingering: QuizModeConfig<any, any>;
    sameNote: QuizModeConfig<any, any>;
  };
  engine: StringInstrumentEngine<any, any>;
}

const celloInstrument: InstrumentDef = {
  id: "cello",
  label: "Cello",
  clefs: ["bass", "tenor", "treble"],
  modes: {
    noteId: createNoteIdMode("cello", "Cello", ["bass", "tenor", "treble"]),
    enharmonics: enharmonicsMode,
    fingering: createFingeringMode(celloEngine, "cello", "cello"),
    sameNote: createSameNoteMode(celloEngine, "cello", "cello"),
  },
  engine: celloEngine,
};

const violinInstrument: InstrumentDef = {
  id: "violin",
  label: "Violin",
  clefs: ["treble"],
  modes: {
    noteId: createNoteIdMode("violin", "Violin", ["treble"]),
    enharmonics: enharmonicsMode,
    fingering: createFingeringMode(violinEngine, "violin", "violin"),
    sameNote: createSameNoteMode(violinEngine, "violin", "violin"),
  },
  engine: violinEngine,
};

export const INSTRUMENTS: InstrumentDef[] = [celloInstrument, violinInstrument];

export function getInstrument(id: string): InstrumentDef {
  return INSTRUMENTS.find((i) => i.id === id) ?? INSTRUMENTS[0];
}
