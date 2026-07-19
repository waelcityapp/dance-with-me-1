const fs = require('fs');
let code = fs.readFileSync('src/components/modals/NotificationsModal.tsx', 'utf8');

code = code.replace(/const \{ lang, notifications, markAllNotificationsAsRead, pushEnabled, togglePushNotifications \} = useApp\(\);/,
`const { lang, notifications, markAllNotificationsAsRead, pushEnabled, togglePushNotifications, user } = useApp();
  
  const visibleNotifications = notifications.filter(n => !n.userId || n.userId === user?.id);`);

code = code.replace(/notifications\.some/g, "visibleNotifications.some");
code = code.replace(/notifications\.length/g, "visibleNotifications.length");
code = code.replace(/notifications\.map/g, "visibleNotifications.map");

fs.writeFileSync('src/components/modals/NotificationsModal.tsx', code);
console.log('Fixed NotificationsModal filtering');
