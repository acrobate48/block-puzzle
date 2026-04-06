// Kill-switch: replaces any previously installed SW and immediately unregisters
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => {
  self.registration.unregister().catch(()=>{});
  self.clients.claim().catch(()=>{});
});
