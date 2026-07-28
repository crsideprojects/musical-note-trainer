import { Link } from "react-router-dom";

const MODES = [
  { path: "/note-id", label: "Note ID", description: "Name the note shown on the staff." },
  { path: "/enharmonics", label: "Enharmonics", description: "Name another spelling for the same pitch." },
  { path: "/fingering", label: "Fingering", description: "Find the string, position, and finger for a note." },
  {
    path: "/same-note",
    label: "Same note, different strings",
    description: "Find every place on the fingerboard that plays a given note.",
  },
  { path: "/reference", label: "Reference", description: "Browse any note across every clef and the fingerboard." },
];

export function Home() {
  return (
    <div className="page home-page">
      <h1>Musical Note Trainer</h1>
      <p>Cello note-reading and fingering practice.</p>
      <nav className="mode-menu">
        {MODES.map((mode) => (
          <Link key={mode.path} to={mode.path} className="mode-card">
            <h2>{mode.label}</h2>
            <p>{mode.description}</p>
          </Link>
        ))}
      </nav>
    </div>
  );
}
