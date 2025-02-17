self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || "This is a description of the notification",
    icon:
      data.icon ||
      "https://cdn-icons-png.freepik.com/256/18296/18296255.png?ga=GA1.1.882692981.1736500425&semt=ais_hybrid",
    title: data.title || "New Notification",
    data: data.url || "http://localhost:5173",
  };

  event.waitUntil(self.registration.showNotification(options.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(clients.openWindow(event.notification.data));
});
