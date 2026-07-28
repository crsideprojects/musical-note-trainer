import { Link } from "react-router-dom";
import { useInstrument } from "../InstrumentContext";

const MODES = [
  {
    path: "/note-id",
    icon: "🎼",
    label: "Note ID",
    description: "Name the note on the staff, or its enharmonic spelling — with a line/space hint and a “how do I play this?” reveal.",
  },
  {
    path: "/reference",
    icon: "📖",
    label: "Reference",
    description: "Browse any note across every clef and the fingerboard.",
  },
];

export function Home() {
  const { instrument } = useInstrument();
  return (
    <div className="page home-page">
      <h1>Musical Note Trainer</h1>
      <p>{instrument.label} note-reading and fingering practice.</p>
      <nav className="mode-menu">
        {MODES.map((mode) => (
          <Link key={mode.path} to={mode.path} className="mode-card">
            <span className="mode-card__icon" aria-hidden="true">
              {mode.icon}
            </span>
            <h2>{mode.label}</h2>
            <p>{mode.description}</p>
          </Link>
        ))}
      </nav>
    </div>
  );
}
