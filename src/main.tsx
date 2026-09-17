import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/accountReferenceBootstrap';

// Register Service Worker for PWA and Web Push
if ('serviceWorker' in navigator) {
  const hadActiveServiceWorker = Boolean(navigator.serviceWorker.controller);
  let refreshingForUpdate = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadActiveServiceWorker || refreshingForUpdate) return;
    refreshingForUpdate = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(async (registration) => {
        console.log('[CityEve SW] Service Worker registered with scope:', registration.scope);
        try {
          await registration.update();
        } catch (updateError) {
          console.warn('[CityEve SW] Update check failed:', updateError);
        }
      })
      .catch((error) => {
        console.warn('[CityEve SW] Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
