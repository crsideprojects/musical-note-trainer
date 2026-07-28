import { Accidental, Formatter, Renderer, Stave, StaveNote } from "vexflow";
import { useEffect, useRef } from "react";
import type { ClefId } from "../music/clef";
import { CLEFS } from "../music/clef";
import type { Pitch } from "../music/pitch";
import { toVexKey } from "../music/pitch";

interface StaffRendererProps {
  clef: ClefId;
  pitch: Pitch;
  width?: number;
  height?: number;
}

export function StaffRenderer({ clef, pitch, width = 220, height = 160 }: StaffRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";

    const vexflowClef = CLEFS[clef].vexflowClef;
    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();

    const stave = new Stave(10, 20, width - 20);
    stave.addClef(vexflowClef);
    stave.setContext(context).draw();

    const note = new StaveNote({
      keys: [toVexKey(pitch)],
      duration: "q",
      clef: vexflowClef,
    });
    if (pitch.accidental !== 0) {
      note.addModifier(new Accidental(pitch.accidental === 1 ? "#" : "b"), 0);
    }

    Formatter.FormatAndDraw(context, stave, [note]);
  }, [clef, pitch, width, height]);

  return <div ref={containerRef} className="staff-renderer" aria-label={`${clef} clef staff`} />;
}
