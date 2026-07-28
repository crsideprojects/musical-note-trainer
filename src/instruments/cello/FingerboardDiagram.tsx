import type { CelloFingering, CelloString, PositionName } from "./technique";
import { fingersForPosition, isFingeringInRange, POSITIONS, STRINGS } from "./technique";

interface FingerboardDiagramProps {
  /** Fingerings to visually highlight (e.g. the correct answer(s)). */
  highlighted?: CelloFingering[];
  /** Cells the user can click, for the multi-select "same note, different strings" mode. */
  selectable?: boolean;
  selected?: CelloFingering[];
  onToggle?: (fingering: CelloFingering) => void;
}

function fingeringKey(f: { string: CelloString; position: PositionName; finger: number }): string {
  return `${f.string}-${f.position}-${f.finger}`;
}

function includesFingering(list: CelloFingering[], target: { string: CelloString; position: PositionName; finger: number }): boolean {
  return list.some((f) => fingeringKey(f) === fingeringKey(target));
}

export function FingerboardDiagram({
  highlighted = [],
  selectable = false,
  selected = [],
  onToggle,
}: FingerboardDiagramProps) {
  const rows: { label: string; position: PositionName; isOpenRow?: boolean }[] = [
    { label: "Open", position: "I", isOpenRow: true },
    ...POSITIONS.map((p) => ({ label: p.name, position: p.name })),
  ];

  return (
    <table className="fingerboard-diagram">
      <caption className="sr-only">Cello fingerboard chart</caption>
      <thead>
        <tr>
          <th scope="col">Position</th>
          {STRINGS.map((s) => (
            <th scope="col" key={s}>
              {s} string
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <th scope="row">{row.label}</th>
            {STRINGS.map((string) => {
              const fingers = row.isOpenRow ? [0] : fingersForPosition(row.position);
              return (
                <td key={string}>
                  <div className="fingerboard-cell">
                    {fingers.map((finger) => {
                      const fingering: CelloFingering = { string, position: row.position, finger };
                      if (!isFingeringInRange(fingering) && !(row.isOpenRow && finger === 0)) return null;
                      const isHighlighted = includesFingering(highlighted, fingering);
                      const isSelected = includesFingering(selected, fingering);
                      const label = finger === 0 ? (row.isOpenRow ? "0" : "T") : String(finger);
                      const className = [
                        "finger-dot",
                        isHighlighted ? "finger-dot--highlighted" : "",
                        isSelected ? "finger-dot--selected" : "",
                      ]
                        .filter(Boolean)
                        .join(" ");
                      if (selectable) {
                        return (
                          <button
                            key={finger}
                            type="button"
                            className={className}
                            aria-pressed={isSelected}
                            onClick={() => onToggle?.(fingering)}
                          >
                            {label}
                          </button>
                        );
                      }
                      return (
                        <span key={finger} className={className}>
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
