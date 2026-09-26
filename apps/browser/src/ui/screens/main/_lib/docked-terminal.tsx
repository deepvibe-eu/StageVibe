import { createContext, type ReactNode, useContext } from 'react';
import { useKartonState } from '@ui/hooks/use-karton';

/**
 * The terminal that is currently rendered in the docked panel below the file
 * tree. Empty (`null`) means no terminal is docked, so terminal tabs render in
 * the content area as before.
 *
 * For terminal tabs the tab id *is* the terminal id, which is why the value is
 * compared against the tab id in `PerTabContent`.
 */
const DockedTerminalContext = createContext<string | null>(null);

export function DockedTerminalProvider({
  value,
  children,
}: {
  value: string | null;
  children: ReactNode;
}) {
  return (
    <DockedTerminalContext.Provider value={value}>
      {children}
    </DockedTerminalContext.Provider>
  );
}

export function useDockedTerminalId(): string | null {
  return useContext(DockedTerminalContext);
}

/**
 * Selects the terminal tab that should dock below the file tree: the active
 * content tab while it is a terminal. Only when the file tree column is
 * visible — without it there is no column to dock into, and the terminal stays
 * a normal content tab.
 */
export function useActiveDockedTerminalId(): string | null {
  return useKartonState((s) => {
    if (!s.fileTree.visible) return null;
    const activeId = s.contentTabs.activeTabId;
    if (!activeId) return null;
    const tab = s.contentTabs.tabs[activeId];
    if (!tab || tab.type !== 'terminal') return null;
    return activeId;
  });
}
