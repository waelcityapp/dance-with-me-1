const fs = require('fs');
let path = 'src/components/events/EventCard.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(
  '<motion.div\n      layout',
  '<motion.div\n      id={`event-${event.id}`}\n      layout'
);
fs.writeFileSync(path, content);
console.log('EventCard patched');
