import { Chat } from './chat';
import {
  ResizablePanel,
  type ImperativePanelHandle,
} from '@stagewise/stage-ui/components/resizable';
import { useRef, type ReactNode } from 'react';
import { useSidebarCollapsed } from '../_components/sidebar-collapsed-context';
import { SidebarTitlebarRow } from '../_components/sidebar-titlebar-row';
import { useOpenAgent } from '@ui/hooks/use-open-chat';
import { useKartonState } from '@ui/hooks/use-karton';

type AgentChatProps = {
  topRightActions?: ReactNode;
  topLeftActions?: ReactNode;
  defaultSize?: number;
  minSize?: number;
  /** Reports the user-adjusted panel size so the layout can persist it. */
  onPanelResize?: (size: number) => void;
};

export function AgentChat({
  topRightActions,
  topLeftActions,
  defaultSize = 35,
  minSize = 20,
  onPanelResize,
}: AgentChatProps) {
  const panelRef = useRef<ImperativePanelHandle>(null);
  const previousSizeRef = useRef<number | null>(null);
  const { collapsed } = useSidebarCollapsed();
  const [openAgent] = useOpenAgent();

  const agentTitle = useKartonState((s) =>
    openAgent ? s.agents.instances[openAgent]?.state.title : undefined,
  );

  return (
    <ResizablePanel
      ref={panelRef}
      id="sidebar-panel"
      order={1}
      defaultSize={defaultSize}
      minSize={minSize}
      maxSize={80}
      onResize={(size) => {
        if (size > 0) {
          previousSizeRef.current = size;
          onPanelResize?.(size);
        }
      }}
      className="@container group overflow-visible! relative z-10 flex h-full flex-col items-stretch justify-between bg-background"
    >
      {topLeftActions && (
        <div className="app-no-drag absolute top-1 left-2 z-20 flex items-center gap-0 rounded-xl">
          {topLeftActions}
        </div>
      )}
      {topRightActions && (
        <div
          data-tutorial="new-tab-buttons"
          className="app-no-drag absolute top-1 right-2 z-20 flex items-center gap-0 rounded-xl"
        >
          {topRightActions}
        </div>
      )}
      {collapsed && (
        <SidebarTitlebarRow absolute sidebarCollapsed agentTitle={agentTitle} />
      )}
      <div className="flex h-full flex-col items-stretch justify-between p-2">
        <Chat />
      </div>
    </ResizablePanel>
  );
}
