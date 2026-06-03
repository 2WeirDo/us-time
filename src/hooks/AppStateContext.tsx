import { createContext, useContext, ReactNode } from 'react';
import { useAppState } from './useAppState';

type AppStateContextType = ReturnType<typeof useAppState>;

const AppStateContext = createContext<AppStateContextType | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const appState = useAppState();
  return (
    <AppStateContext.Provider value={appState}>
      {children}
    </AppStateContext.Provider>
  );
}

/**
 * Use this instead of calling useAppState() directly.
 * Ensures all components share the same state.
 */
export function useSharedAppState(): AppStateContextType {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useSharedAppState must be used within AppStateProvider');
  }
  return ctx;
}
