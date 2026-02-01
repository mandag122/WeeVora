import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { SelectedSession, DateRange } from "@shared/schema";

const STORAGE_KEY = "weevora_selected_sessions";
const DATE_RANGE_KEY = "weevora_date_range";

const defaultDateRange: DateRange = {
  start: "2026-06-01",
  end: "2026-08-31"
};

interface SessionContextType {
  selectedSessions: SelectedSession[];
  dateRange: DateRange;
  toggleSession: (session: SelectedSession) => void;
  removeSession: (sessionId: string) => void;
  setDateRange: (range: DateRange) => void;
  clearAllSessions: () => void;
  isCalendarOpen: boolean;
  setCalendarOpen: (open: boolean) => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [selectedSessions, setSelectedSessions] = useState<SelectedSession[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    try {
      const stored = localStorage.getItem(DATE_RANGE_KEY);
      return stored ? JSON.parse(stored) : defaultDateRange;
    } catch {
      return defaultDateRange;
    }
  });

  const [isCalendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedSessions));
  }, [selectedSessions]);

  useEffect(() => {
    localStorage.setItem(DATE_RANGE_KEY, JSON.stringify(dateRange));
  }, [dateRange]);

  const toggleSession = (session: SelectedSession) => {
    setSelectedSessions(prev => {
      const exists = prev.some(s => s.sessionId === session.sessionId);
      if (exists) {
        return prev.filter(s => s.sessionId !== session.sessionId);
      }
      return [...prev, session];
    });
  };

  const removeSession = (sessionId: string) => {
    setSelectedSessions(prev => prev.filter(s => s.sessionId !== sessionId));
  };

  const clearAllSessions = () => {
    setSelectedSessions([]);
  };

  return (
    <SessionContext.Provider value={{
      selectedSessions,
      dateRange,
      toggleSession,
      removeSession,
      setDateRange,
      clearAllSessions,
      isCalendarOpen,
      setCalendarOpen
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext(): SessionContextType | null {
  return useContext(SessionContext);
}
