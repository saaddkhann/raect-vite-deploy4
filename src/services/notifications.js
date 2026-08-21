import { getToken, onMessage } from 'firebase/messaging';
import { firebaseConfig, fcmVapidKey, getMessagingIfSupported } from './firebase';

function encodeConfig(config) { return encodeURIComponent(JSON.stringify(config)); }

async function prepareMessaging() {
  if (!('Notification' in window) || !fcmVapidKey) return null;
  const messaging = await getMessagingIfSupported();
  if (!messaging) return null;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;
  const swUrl = `/firebase-messaging-sw.js?config=${encodeConfig(firebaseConfig)}`;
  const registration = await navigator.serviceWorker.register(swUrl);
  return { messaging, registration };
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return { ok: false, reason: 'unsupported' };
  const prepared = await prepareMessaging();
  if (!prepared) return { ok: false, reason: Notification.permission === 'denied' ? 'denied' : 'not_configured' };
  return { ok: true };
}

export async function getPlayerNotificationToken() {
  if (!('Notification' in window) || Notification.permission !== 'granted' || !fcmVapidKey) return '';
  const messaging = await getMessagingIfSupported();
  if (!messaging) return '';
  const swUrl = `/firebase-messaging-sw.js?config=${encodeConfig(firebaseConfig)}`;
  const registration = await navigator.serviceWorker.register(swUrl);
  return (await getToken(messaging, { vapidKey: fcmVapidKey, serviceWorkerRegistration: registration })) || '';
}

export async function attachForegroundNotificationListener(callback) {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}
