//
self.addEventListener("install", event => {
   console.log("Service worker installed");
});

self.addEventListener("activate", event => {
   console.log("Service worker activated");
});

// プッシュ通知（web-push）受信時の処理
self.addEventListener('push', function (event) {
  const data = event.data.json();
  const title = data.title || '新しいアクションがありました';
  const options = {
    body: data.body || '詳細はクリックして確認してください',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: {
      url: data.url,
    },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// プッシュ通知（web-push）クリック時の処理
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(() => {
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    }),
  );
});