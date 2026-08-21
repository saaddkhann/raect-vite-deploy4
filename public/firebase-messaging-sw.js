/* Firebase Cloud Messaging service worker. The Firebase config is passed safely
   in the registration URL by the app; it is web-app configuration, not a secret. */
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js');

const params = new URL(self.location.href).searchParams;
let config = {};
try { config = JSON.parse(params.get('config') || '{}'); } catch (_) {}

if (config.apiKey && config.projectId && config.messagingSenderId && config.appId) {
  firebase.initializeApp(config);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || 'Madanpur Cricket League';
    const options = {
      body: payload.notification?.body || 'You have a tournament update.',
      icon: '/icon-192.png',
      data: { link: payload.fcmOptions?.link || payload.data?.link || '/#register' },
    };
    self.registration.showNotification(title, options);
  });

  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const link = event.notification.data?.link || '/#register';
    event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(link);
    }));
  });
}
