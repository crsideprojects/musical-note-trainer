import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import type { InstrumentDef } from "../instruments/registry";
import { getInstrument, INSTRUMENTS } from "../instruments/registry";

const STORAGE_KEY = "mnt.v1.selectedInstrument";

interface InstrumentContextValue {
  instrument: InstrumentDef;
  setInstrumentId: (id: string) => void;
}

const InstrumentContext = createContext<InstrumentContextValue | null>(null);

function loadInitialInstrumentId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? INSTRUMENTS[0].id;
  } catch {
    return INSTRUMENTS[0].id;
  }
}

export function InstrumentProvider({ children }: { children: ReactNode }) {
  const [instrumentId, setInstrumentIdState] = useState(loadInitialInstrumentId);

  function setInstrumentId(id: string) {
    setInstrumentIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // localStorage unavailable — selection just won't persist across reloads.
    }
  }

  const value: InstrumentContextValue = {
    instrument: getInstrument(instrumentId),
    setInstrumentId,
  };

  return <InstrumentContext.Provider value={value}>{children}</InstrumentContext.Provider>;
}

export function useInstrument(): InstrumentContextValue {
  const context = useContext(InstrumentContext);
  if (!context) throw new Error("useInstrument must be used within an InstrumentProvider");
  return context;
}
