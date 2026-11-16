import { registerSW } from 'virtual:pwa-register';

export const pwa = $state({
  /** A newer version has been downloaded and is waiting. */
  updateReady: false,
  /** Everything is cached; the app works without a connection. */
  offlineReady: false,
});

let apply: ((reload?: boolean) => Promise<void>) | undefined;

export function startPwa() {
  if (!('serviceWorker' in navigator)) return;
  apply = registerSW({
    onNeedRefresh: () => (pwa.updateReady = true),
    onOfflineReady: () => (pwa.offlineReady = true),
  });
}

export const applyUpdate = () => apply?.(true);

/** Running from the Home Screen (or another installed context) rather than a browser tab. */
export const isStandalone = (): boolean =>
  matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;

/** iPhone/iPad Safari, where installing is a manual Share → Add to Home Screen. */
export function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
  return ios && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

export const isIos = (): boolean =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1);
