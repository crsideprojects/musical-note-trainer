import { describeTechniqueConformance } from "../../core/instrument/techniqueConformance";
import { VIOLIN_MIDI_RANGE, violinTechnique } from "./technique";

describeTechniqueConformance("violin", violinTechnique, VIOLIN_MIDI_RANGE);
