const fs = require('fs');

let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const target1 = `  toggleEventLike: (eventId: string) => void;`;
const replace1 = `  toggleEventLike: (eventId: string) => void;
  incrementEventView: (eventId: string) => void;`;

const target2 = `  const toggleEventLike = (eventId: string) => {`;
const replace2 = `  const incrementEventView = (eventId: string) => {
    // Only increment once per session to avoid spamming
    const viewedKey = 'viewed_' + eventId;
    if (sessionStorage.getItem(viewedKey)) return;
    sessionStorage.setItem(viewedKey, 'true');

    setEvents(prev => prev.map(ev => {
      if (ev.id === eventId) {
        const updatedEv = {
          ...ev,
          viewsCount: (ev.viewsCount || 0) + 1
        };
        saveEventToFirestore(updatedEv);
        return updatedEv;
      }
      return ev;
    }));
  };

  const toggleEventLike = (eventId: string) => {`;

content = content.replace(target1, replace1);
content = content.replace(target2, replace2);

const target3 = `        toggleEventLike,`;
const replace3 = `        toggleEventLike,
        incrementEventView,`;

content = content.replace(target3, replace3);

fs.writeFileSync('src/context/AppContext.tsx', content);
console.log('done context view');
