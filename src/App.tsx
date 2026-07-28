import { HashRouter, Link, Route, Routes } from "react-router-dom";
import { Home } from "./app/pages/Home";
import { ReferencePage } from "./app/pages/ReferencePage";
import { enharmonicsMode } from "./core/modes/enharmonicsMode";
import { noteIdMode } from "./core/modes/noteIdMode";
import { QuizRunner } from "./core/quiz/QuizRunner";
import { fingeringMode } from "./instruments/cello/modes/fingeringMode";
import { sameNoteMode } from "./instruments/cello/modes/sameNoteMode";

function App() {
  return (
    <HashRouter>
      <header className="app-header">
        <Link to="/" className="app-title">
          Musical Note Trainer
        </Link>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/note-id" element={<QuizRunner config={noteIdMode} />} />
          <Route path="/enharmonics" element={<QuizRunner config={enharmonicsMode} />} />
          <Route path="/fingering" element={<QuizRunner config={fingeringMode} />} />
          <Route path="/same-note" element={<QuizRunner config={sameNoteMode} />} />
          <Route path="/reference" element={<ReferencePage />} />
        </Routes>
      </main>
    </HashRouter>
  );
}

export default App;
