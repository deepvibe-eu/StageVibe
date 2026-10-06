import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useKartonConnected,
  useKartonReconnectState,
} from '@ui/hooks/use-karton';
import { WebContentsBoundsSyncer } from '@ui/components/web-contents-bounds-syncer';
import { TutorialOverlay } from '@ui/components/tutorial/tutorial-overlay';
import { WhatsNewDialog } from '@ui/components/release-notes';
import bunny from '../assets/bunny.png';

// Lazy-load the heavy screen tree. It only renders *after* the karton
// connection is established, yet importing it statically pulled its entire
// module graph (tiptap, shiki + oniguruma/wasm, prosemirror-highlight, mermaid,
// code-block stacks, ...) onto the critical path to React's first mount. That
// delayed `did-finish-load`, which gates the OS window becoming visible — i.e.
// the "DevTools open but main window blank" wait. Splitting it lets React mount
// the shell (and the window appear) at the connecting spinner immediately; the
// large chunk loads off the critical path while the spinner is already shown.
const DefaultLayout = lazy(() =>
  import('./main').then((m) => ({ default: m.DefaultLayout })),
);

function LoadingScreen({
  reconnectState,
}: {
  reconnectState: ReturnType<typeof useKartonReconnectState>;
}) {
  const { t } = useTranslation('common');
  return (
    <div className="absolute inset-0 flex size-full flex-col items-center justify-center gap-4">
      {/* Bunny mark: masked so it takes the theme foreground (white in dark
          appearance, black in light appearance). */}
      <div
        role="img"
        aria-label="StageVibe"
        className="aspect-square w-1/6 max-w-12 animate-pulse bg-foreground drop-shadow-black/30 drop-shadow-lg"
        style={{
          maskImage: `url(${bunny})`,
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          maskSize: 'contain',
          WebkitMaskImage: `url(${bunny})`,
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          WebkitMaskSize: 'contain',
        }}
      />
      {reconnectState.isReconnecting && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-muted-foreground text-sm">
            {t('boot.reconnecting', { attempt: reconnectState.attempt })}
          </p>
        </div>
      )}
      {reconnectState.failed && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-error-foreground text-sm">
            {t('boot.connectionFailed', { attempt: reconnectState.attempt })}
          </p>
          <p className="text-muted-foreground text-xs">{t('boot.restart')}</p>
        </div>
      )}
    </div>
  );
}

export function ScreenRouter() {
  const connected = useKartonConnected();
  const reconnectState = useKartonReconnectState();
  return (
    <div className="fixed inset-0">
      {!connected ? (
        <LoadingScreen reconnectState={reconnectState} />
      ) : (
        <Suspense fallback={<LoadingScreen reconnectState={reconnectState} />}>
          <DefaultLayout show />
          <WebContentsBoundsSyncer />
          <WhatsNewDialog />
        </Suspense>
      )}
      <TutorialOverlay />
    </div>
  );
}
