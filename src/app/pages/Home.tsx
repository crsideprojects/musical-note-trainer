import { Link } from "react-router-dom";
import { useInstrument } from "../InstrumentContext";

const MODES = [
  {
    path: "/note-id",
    icon: "🎼",
    label: "Note ID",
    description: "Name the note shown on the staff.",
  },
  {
    path: "/enharmonics",
    icon: "🔁",
    label: "Enharmonics",
    description: "Name another spelling for the same pitch.",
  },
  {
    path: "/fingering",
    icon: "👆",
    label: "Fingering",
    description: "Find the string, position, and finger for a note.",
  },
  {
    path: "/same-note",
    icon: "🧭",
    label: "Same note, different strings",
    description: "Find every place on the fingerboard that plays a given note.",
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
