/**
 * Registers the offline service worker for production builds, and tears down any
 * lingering worker/caches in development so stale cache-first `/_next/static/`
 * chunks can't be served against freshly compiled HTML (causes hydration mismatches).
 */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return

  if (process.env.NODE_ENV !== 'production') {
    void unregisterServiceWorker()
    return
  }

  window.addEventListener('load', (): void => {
    void navigator.serviceWorker.register('/sw.js').catch((): void => undefined)
  })
}

/**
 * Unregisters every active service worker and deletes all caches so the browser
 * stops serving stale assets cached by a previous production build during development.
 */
async function unregisterServiceWorker(): Promise<void> {
  try {
    const registrations: readonly ServiceWorkerRegistration[] = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((registration): Promise<boolean> => registration.unregister()))

    if ('caches' in window) {
      const keys: readonly string[] = await caches.keys()
      await Promise.all(keys.map((key): Promise<boolean> => caches.delete(key)))
    }
  } catch {
    return
  }
}
