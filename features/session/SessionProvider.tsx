"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { clearUser, parseUser, readUserRaw, writeUser } from "@/features/session/lib/session-storage";
import type { SessionUser } from "@/features/session/model/user";

type SessionContextValue = {
  user: SessionUser | null;
  login: (user: SessionUser) => void;
  signOut: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

// av_user is the single source of truth. The raw string is the snapshot so it stays
// referentially stable; the server snapshot is null so hydration always starts signed out.
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

const getServerSnapshot = () => null;

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, readUserRaw, getServerSnapshot);
  const user = useMemo(() => parseUser(raw), [raw]);

  const login = useCallback((next: SessionUser) => {
    writeUser(next);
    notify();
  }, []);

  const signOut = useCallback(() => {
    clearUser();
    notify();
  }, []);

  const value = useMemo(() => ({ user, login, signOut }), [user, login, signOut]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
