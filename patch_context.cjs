const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

code = code.replace(
`  const addNewEvent = (newEv: Omit<DanceEvent, 'id' | 'likesCount' | 'uploadDate'>) => {`,
`  const addNewEvent = (newEv: Omit<DanceEvent, 'id' | 'likesCount' | 'uploadDate'>): DanceEvent | undefined => {`
);

code = code.replace(
`    setNotifications(prev => [newNotif, ...prev]);
    saveNotificationToFirestore(newNotif);
  };`,
`    setNotifications(prev => [newNotif, ...prev]);
    saveNotificationToFirestore(newNotif);
    return createdEvent;
  };`
);

fs.writeFileSync('src/context/AppContext.tsx', code);
