import { registerSW } from 'virtual:pwa-register';
import clipList from './clips.json';

declare const __BUILD__: string;
/** When this copy of the app was built. Shown in Profile so it is clear which version is running. */
export const BUILD: string = __BUILD__;

export const pwa = $state({
  /** A newer version has been downloaded and is waiting. */
  updateReady: false,
  /** Everything is cached; the app works without a connection. */
  offlineReady: false,
  /** Looking for a newer version right now. */
  checking: false,
  /** Voice clips saved for offline use, out of `audioTotal`. */
  audioSaved: 0,
  audioTotal: (clipList as string[]).length,
});

let apply: ((reload?: boolean) => Promise<void>) | undefined;
let registration: ServiceWorkerRegistration | undefined;

export function startPwa() {
  if (!('serviceWorker' in navigator)) return;
  apply = registerSW({
    onNeedRefresh: () => (pwa.updateReady = true),
    onOfflineReady: () => (pwa.offlineReady = true),
    // A Home Screen app is resumed, not reloaded, so look for a new version whenever it comes back to the front.
    onRegisteredSW: (_url, reg) => {
      registration = reg;
      if (!registration) return;
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void registration?.update();
      });
    },
  });
}

export const applyUpdate = () => apply?.(true);

/** Ask the server for a newer version now. Returns true if one was found (the update prompt follows). */
export async function checkForUpdate(): Promise<boolean> {
  if (!registration) return false;
  pwa.checking = true;
  try {
    await registration.update();
    const coming = registration.installing ?? registration.waiting;
    if (!coming) return false;
    if (registration.waiting) pwa.updateReady = true;
    return true;
  } catch {
    return false;
  } finally {
    pwa.checking = false;
  }
}

const AUDIO_CACHE = 'pontino-audio';
let saving = false;

/**
 * Save every voice clip on the device, a few at a time, so audio works offline.
 * Runs in the background after start-up and picks up where it left off.
 */
export async function saveAudioOffline() {
  if (saving || !('caches' in window) || !navigator.onLine) return;
  if ((navigator as { connection?: { saveData?: boolean } }).connection?.saveData) return;
  saving = true;
  try {
    const cache = await caches.open(AUDIO_CACHE);
    const want = new Map((clipList as string[]).map((id) => [new URL(`audio/${id}.mp3`, document.baseURI).href, id]));
    const have = new Set<string>();
    for (const req of await cache.keys()) {
      // Clips that no lesson uses any more are removed.
      if (want.has(req.url)) have.add(req.url);
      else void cache.delete(req);
    }
    pwa.audioSaved = have.size;
    const todo = [...want.keys()].filter((u) => !have.has(u));
    const worker = async () => {
      for (let url = todo.pop(); url; url = todo.pop()) {
        try {
          const res = await fetch(url, { cache: 'no-cache' });
          if (res.status === 200) {
            await cache.put(url, res);
            pwa.audioSaved++;
          }
        } catch {
          return; // offline or out of space: try again next time the app opens
        }
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
  } catch {
    // Storage unavailable (private browsing): audio simply needs a connection.
  } finally {
    saving = false;
  }
}

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
