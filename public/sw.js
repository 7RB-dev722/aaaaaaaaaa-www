// Service Worker for Cheatloop Admin Notifications

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming push notifications (Background)
self.addEventListener('push', function(event) {
  // Ensure we have permission
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    return;
  }

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'تنبيه إداري', body: event.data.text() };
    }
  }

  const title = data.title || 'طلب شراء جديد';
  const message = data.body || 'لديك تحديث جديد في لوحة التحكم';
  const icon = '/cheatloop copy.png';

  const options = {
    body: message,
    icon: icon,
    badge: icon,
    vibrate: [200, 100, 200],
    tag: 'purchase-notification', // Use a fixed tag to prevent stacking too many
    renotify: true,
    requireInteraction: true, // Keep notification until user interacts
    data: {
      url: data.url || '/admin',
      dateOfArrival: Date.now()
    },
    actions: [
      { action: 'open', title: 'عرض التفاصيل' }
    ]
  };

  // Use event.waitUntil to ensure the notification is shown before the SW terminates
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  event.notification.close(); // Close the notification

  const urlToOpen = event.notification.data?.url || '/admin';

  // Focus on the admin window if open, or open a new one
  event.waitUntil(
    clients.matchAll({type: 'window', includeUncontrolled: true}).then(function(clientList) {
      // Check if there is already a window/tab open with the admin URL
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        // If a tab matches the URL, focus it
        if (client.url.includes('admin') && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
