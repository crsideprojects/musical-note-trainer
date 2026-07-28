import { describeTechniqueConformance } from "../../core/instrument/techniqueConformance";
import { CELLO_MIDI_RANGE, celloTechnique } from "./technique";

describeTechniqueConformance("cello", celloTechnique, CELLO_MIDI_RANGE);
