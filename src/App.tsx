import { HashRouter, Link, Route, Routes } from "react-router-dom";
import { Home } from "./app/pages/Home";
import { InstrumentProvider, useInstrument } from "./app/InstrumentContext";
import { ReferencePage } from "./app/pages/ReferencePage";
import { QuizRunner } from "./core/quiz/QuizRunner";
import type { QuizModeConfig } from "./core/quiz/QuizModeConfig";
import type { InstrumentDef } from "./instruments/registry";
import { INSTRUMENTS } from "./instruments/registry";

function InstrumentSelector() {
  const { instrument, setInstrumentId } = useInstrument();
  return (
    <label className="instrument-selector">
      Instrument{" "}
      <select value={instrument.id} onChange={(e) => setInstrumentId(e.target.value)}>
        {INSTRUMENTS.map((i) => (
          <option key={i.id} value={i.id}>
            {i.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Renders the currently selected instrument's mode, remounting fresh on switch. */
function ModeRoute({ pick }: { pick: (instrument: InstrumentDef) => QuizModeConfig<any, any> }) {
  const { instrument } = useInstrument();
  const config = pick(instrument);
  return <QuizRunner key={`${instrument.id}-${config.id}`} config={config} />;
}

function App() {
  return (
    <InstrumentProvider>
      <HashRouter>
        <header className="app-header">
          <Link to="/" className="app-title">
            Musical Note Trainer
          </Link>
          <InstrumentSelector />
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/note-id" element={<ModeRoute pick={(i) => i.modes.noteId} />} />
            <Route path="/enharmonics" element={<ModeRoute pick={(i) => i.modes.enharmonics} />} />
            <Route path="/fingering" element={<ModeRoute pick={(i) => i.modes.fingering} />} />
            <Route path="/same-note" element={<ModeRoute pick={(i) => i.modes.sameNote} />} />
            <Route path="/reference" element={<ReferencePage />} />
          </Routes>
        </main>
      </HashRouter>
    </InstrumentProvider>
  );
}

export default App;
