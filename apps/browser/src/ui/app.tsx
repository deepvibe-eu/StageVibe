import './app.css';

import type { FunctionComponent } from 'react';
import { Toaster } from '@stagewise/stage-ui/components/toaster';
import { ContextProviders } from './components/context-providers';
import { ScreenRouter } from './screens';
import { TitleManager } from './components/title-manager';

export const App: FunctionComponent = () => {
  return (
    <ContextProviders>
      <TitleManager />

      <ScreenRouter />

      {/* Hosts every direct `toast(...)` call (settings, file tree, chat
          actions). The agent-notification overlay was removed upstream and
          took its `<Toaster />` with it, orphaning those calls. */}
      <Toaster position="bottom-right" swipeDirections={['bottom']} />
    </ContextProviders>
  );
};
