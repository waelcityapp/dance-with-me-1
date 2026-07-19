const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

code = code.replace(
`  const addNewEvent = (newEv: Omit<DanceEvent, 'id' | 'likesCount' | 'uploadDate'>) => {
    if (!user) {
      openGuestAlert('post_ad');
      return;
    }
    const createdEvent: DanceEvent = {
      ...newEv,
      id: \`ev-\${Date.now()}\`,
      likesCount: 1,
      uploadDate: new Date().toISOString()
    };`,
`  const addNewEvent = (newEv: Omit<DanceEvent, 'id' | 'likesCount' | 'uploadDate'>) => {
    if (!user) {
      openGuestAlert('post_ad');
      return;
    }
    
    // Calculate new eventRef
    let maxRef = 1000;
    const assignedRefs = events.map(e => e.eventRef).filter((r): r is number => typeof r === 'number');
    if (assignedRefs.length > 0) {
      maxRef = Math.max(...assignedRefs);
    }
    const newEventRef = maxRef + 1;

    const createdEvent: DanceEvent = {
      ...newEv,
      id: \`ev-\${Date.now()}\`,
      eventRef: newEventRef,
      likesCount: 1,
      uploadDate: new Date().toISOString()
    };`
);

fs.writeFileSync('src/context/AppContext.tsx', code);
console.log('Fixed addNewEvent eventRef generation');
