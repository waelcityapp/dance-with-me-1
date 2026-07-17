const fs = require('fs');
let code = fs.readFileSync('src/components/home/HomeFeed.tsx', 'utf-8');
code = code.replace(
  "index={idx}",
  "index={activeEvents.findIndex(e => e.id === ev.id)}"
);
fs.writeFileSync('src/components/home/HomeFeed.tsx', code);
