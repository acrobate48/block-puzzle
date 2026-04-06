// Kill-switch: installs and unregisters without touching current page
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => {
  self.registration.unregister().catch(()=>{});
  // No clients.claim() — avoids reloading the current page
});
