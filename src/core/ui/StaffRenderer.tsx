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
  /** Overlay faint letter names next to each line/space, as a staff-reading aid. */
  showHint?: boolean;
}

const HINT_MARGIN = 26;
const HINT_COLOR = "rgba(120, 120, 120, 0.6)";

export function StaffRenderer({
  clef,
  pitch,
  width = 220,
  height = 160,
  showHint = false,
}: StaffRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";

    const vexflowClef = CLEFS[clef].vexflowClef;
    const staveX = 10;
    const staveWidth = width - 20;
    const canvasWidth = showHint ? width + HINT_MARGIN : width;

    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(canvasWidth, height);
    const context = renderer.getContext();

    const stave = new Stave(staveX, 20, staveWidth);
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

    if (showHint) {
      try {
        // VexFlow numbers staff lines 0 (top) to 4 (bottom); getYForLine returns
        // the y for the *center* of that line. Spaces are the midpoints between
        // adjacent lines. staffPositions is bottom-to-top (line1..line5), so
        // build the matching y-coordinates in the same order.
        const lineYTopToBottom = [0, 1, 2, 3, 4].map((line) => stave.getYForLine(line));
        const lineYBottomToTop = [...lineYTopToBottom].reverse();
        const ys: number[] = [];
        for (let i = 0; i < 5; i++) {
          ys.push(lineYBottomToTop[i]);
          if (i < 4) ys.push((lineYBottomToTop[i] + lineYBottomToTop[i + 1]) / 2);
        }

        context.save();
        context.setFont("system-ui, sans-serif", 11);
        context.setFillStyle(HINT_COLOR);
        const hintX = staveX + staveWidth + 6;
        CLEFS[clef].staffPositions.forEach((position, i) => {
          context.fillText(position.letter, hintX, ys[i] + 4);
        });
        context.restore();
      } catch {
        // If VexFlow's line-coordinate API ever changes shape, skip the hint
        // rather than breaking the staff render.
      }
    }
  }, [clef, pitch, width, height, showHint]);

  return <div ref={containerRef} className="staff-renderer" aria-label={`${clef} clef staff`} />;
}
