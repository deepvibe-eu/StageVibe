import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useKartonState } from '@ui/hooks/use-karton';

/**
 * Terminal ids that live in the bottom panel instead of the content area.
 *
 * Terminal sessions are still backed by terminal content tabs (the tab owns
 * the session's lifetime and its close button), but the panel decides what is
 * *visible*: it lists every terminal of the current agent and stays visible
 * while the user works in other tabs.
 */
export function useTerminalTabIds(openAgent: string | null): string[] {
  return useKartonState((s) => {
    const ids: string[] = [];
    for (const [id, tab] of Object.entries(s.contentTabs.tabs)) {
      if (tab.type !== 'terminal') continue;
      if (tab.agentInstanceId !== null && tab.agentInstanceId !== openAgent) {
        continue;
      }
      ids.push(id);
    }
    return ids.sort((a, b) => {
      const ta = s.contentTabs.tabs[a]?.createdAt ?? '';
      const tb = s.contentTabs.tabs[b]?.createdAt ?? '';
      return ta < tb ? -1 : ta > tb ? 1 : 0;
    });
  });
}

type TerminalPanelContextValue = {
  /** Terminal ids shown in the panel, oldest first. */
  terminalIds: string[];
  /** Terminal rendered in the panel body. */
  activeTerminalId: string | null;
  setActiveTerminalId: (id: string) => void;
};

const TerminalPanelContext = createContext<TerminalPanelContextValue>({
  terminalIds: [],
  activeTerminalId: null,
  setActiveTerminalId: () => {},
});

/**
 * Owns which terminal the panel shows. Falls back to the newest terminal when
 * the previous selection disappears (closed tab) and clears when none remain.
 */
export function TerminalPanelProvider({
  terminalIds,
  children,
}: {
  terminalIds: string[];
  children: ReactNode;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const activeTerminalId = useMemo(() => {
    if (selected && terminalIds.includes(selected)) return selected;
    return terminalIds.length > 0
      ? (terminalIds[terminalIds.length - 1] ?? null)
      : null;
  }, [selected, terminalIds]);

  useEffect(() => {
    setSelected(activeTerminalId);
  }, [activeTerminalId]);

  const value = useMemo<TerminalPanelContextValue>(
    () => ({ terminalIds, activeTerminalId, setActiveTerminalId: setSelected }),
    [terminalIds, activeTerminalId],
  );

  return (
    <TerminalPanelContext.Provider value={value}>
      {children}
    </TerminalPanelContext.Provider>
  );
}

export function useTerminalPanel(): TerminalPanelContextValue {
  return useContext(TerminalPanelContext);
}
