import type { StringFingering, StringInstrumentEngine } from "./stringInstrumentEngine";

interface DiagramRow<TPosition extends string> {
  label: string;
  position: TPosition;
  isOpenRow?: boolean;
}

interface StringFingerboardDiagramProps<TString extends string, TPosition extends string> {
  engine: StringInstrumentEngine<TString, TPosition>;
  instrumentLabel: string;
  /** Fingerings to visually highlight (e.g. the correct answer(s)). */
  highlighted?: StringFingering<TString, TPosition>[];
  /** Cells the user can click, for the multi-select "same note, different strings" mode. */
  selectable?: boolean;
  selected?: StringFingering<TString, TPosition>[];
  onToggle?: (fingering: StringFingering<TString, TPosition>) => void;
  /** Render only the row(s) matching this filter, e.g. to show one position at a time in a compact card. */
  rowFilter?: (row: DiagramRow<TPosition>) => boolean;
}

function fingeringKey<TString extends string, TPosition extends string>(
  f: StringFingering<TString, TPosition>,
): string {
  return `${f.string}-${f.position}-${f.finger}`;
}

function includesFingering<TString extends string, TPosition extends string>(
  list: StringFingering<TString, TPosition>[],
  target: StringFingering<TString, TPosition>,
): boolean {
  return list.some((f) => fingeringKey(f) === fingeringKey(target));
}

export function StringFingerboardDiagram<TString extends string, TPosition extends string>({
  engine,
  instrumentLabel,
  highlighted = [],
  selectable = false,
  selected = [],
  onToggle,
  rowFilter,
}: StringFingerboardDiagramProps<TString, TPosition>) {
  const openRowPosition = engine.positions[0].name;
  const allRows: DiagramRow<TPosition>[] = [
    { label: "Open", position: openRowPosition, isOpenRow: true },
    ...engine.positions.map((p) => ({ label: p.name, position: p.name })),
  ];
  const rows = rowFilter ? allRows.filter(rowFilter) : allRows;

  return (
    <table className="fingerboard-diagram">
      <caption className="sr-only">{instrumentLabel} fingerboard chart</caption>
      <thead>
        <tr>
          <th scope="col">Position</th>
          {engine.strings.map((s) => (
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
            {engine.strings.map((string) => {
              const fingers = row.isOpenRow ? [0] : engine.fingersForPosition(row.position);
              return (
                <td key={string}>
                  <div className="fingerboard-cell">
                    {fingers.map((finger) => {
                      const fingering: StringFingering<TString, TPosition> = {
                        string,
                        position: row.position,
                        finger,
                      };
                      if (!engine.isFingeringInRange(fingering) && !(row.isOpenRow && finger === 0)) {
                        return null;
                      }
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
