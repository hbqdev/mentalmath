import '@fontsource/alegreya-sans/500.css'
import '@fontsource/alegreya-sans/700.css'
import '@fontsource-variable/source-serif-4'
import '@fontsource-variable/jetbrains-mono'
import './app/styles/tokens.css'
import './app/styles/base.css'

import { createApp } from 'vue'
import { Capacitor } from '@capacitor/core'
import { registerSW } from 'virtual:pwa-register'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')

// Installable and readable offline after the first visit; updates apply on the next load.
// Inside the native app the bundle ships with the APK, so a service worker would only serve
// the previous version's cache after an update. Skip it there and clean up any earlier one.
if (Capacitor.isNativePlatform()) {
  navigator.serviceWorker
    ?.getRegistrations()
    .then((regs) => Promise.all(regs.map((r) => r.unregister())))
    .then(() => caches?.keys())
    .then((keys) => Promise.all((keys ?? []).map((k) => caches.delete(k))))
    .catch(() => {})
} else {
  registerSW({
    immediate: true,
    // Check for a new build every minute while the tab is open, so a deploy lands without a hard refresh.
    onRegisteredSW(_url, registration) {
      if (registration) setInterval(() => registration.update(), 60_000)
    },
  })
}

// After a deploy, a page that still runs the old bundle may ask for a chunk that no longer
// exists; reloading once picks up the new build instead of leaving a blank view.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  const key = 'mentalmath.reloaded-for-chunk'
  if (sessionStorage.getItem(key)) return
  sessionStorage.setItem(key, '1')
  window.location.reload()
})
