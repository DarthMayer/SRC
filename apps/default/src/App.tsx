import * as React from 'react';
import { Toaster } from 'sonner';
import { GenesisAuth } from './lib/genesis-auth';
import MagazzinoPage from './pages/MagazzinoPage';

const App: React.FC = () => {
  React.useEffect(() => {
    document.title = 'Gestionale SARDEGNA';
    document.documentElement.lang = 'it-IT';
    const manifest = document.createElement('link');
    manifest.rel = 'manifest';
    manifest.href = '/manifest.webmanifest';
    document.head.appendChild(manifest);
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
    return () => {
      manifest.remove();
    };
  }, []);

  return (
    <GenesisAuth>
      <MagazzinoPage />
      <Toaster position="top-right" richColors />
    </GenesisAuth>
  );
};

export default App;
