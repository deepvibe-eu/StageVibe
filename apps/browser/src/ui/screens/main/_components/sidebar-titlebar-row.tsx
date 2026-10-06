import { TITLEBAR_HEIGHT } from '@shared/titlebar';
import { cn } from '@ui/utils';
import { useUiZoomCounterScale } from '@ui/hooks/use-ui-zoom-counter-scale';
import { TrafficLightGutter } from './traffic-light-gutter';

/**
 * Titlebar row providing the macOS traffic-light gutter, rendered at the top
 * of a panel so its content stays clear of the traffic lights.
 *
 * The sidebar toggle lives in the chat-panel header (see
 * `SidebarToggleButton`), so it stays at the same screen position whether the
 * sidebar is open or collapsed.
 *
 * Vertical centering is done via flexbox against `TITLEBAR_HEIGHT`, which is
 * the same constant that drives `trafficLightPosition.y` in the main process
 * — so the row and the macOS traffic lights cannot drift apart.
 *
 * Height and the optical sub-pixel nudge are counter-scaled so they stay
 * aligned with the OS-drawn traffic lights regardless of UI zoom.
 */
export function SidebarTitlebarRow({
  absolute = false,
  children,
}: {
  absolute?: boolean;
  children?: React.ReactNode;
}) {
  const counterScale = useUiZoomCounterScale();
  return (
    <div
      style={{
        height: TITLEBAR_HEIGHT * counterScale,
        // Sub-pixel nudge: flex-centering puts content's geometric center on
        // the traffic-light center, but AA + grid rounding makes it read as
        // ~0.5px too high. A CSS transform is the only way to express a
        // fractional offset — `marginTop` would round on non-Retina.
        transform: `translateY(${0.5 * counterScale}px)`,
      }}
      className={cn(
        'flex shrink-0 items-center gap-0.5',
        absolute && 'absolute inset-x-0 top-0 z-10',
      )}
    >
      <TrafficLightGutter />
      {children}
    </div>
  );
}
