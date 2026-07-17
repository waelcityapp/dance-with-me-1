const fs = require('fs');
let code = fs.readFileSync('src/components/home/HomeFeed.tsx', 'utf-8');

const target1 = `                  index={activeEvents.findIndex(e => e.id === ev.id)}`;
const replace1 = `                  index={idx + (isPromoBannerVisible ? 1 : 0)}`;

code = code.replace(target1, replace1);

fs.writeFileSync('src/components/home/HomeFeed.tsx', code);
