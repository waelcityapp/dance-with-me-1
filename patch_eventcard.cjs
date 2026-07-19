const fs = require('fs');
let code = fs.readFileSync('src/components/events/EventCard.tsx', 'utf8');

code = code.replace(
`  const {
    lang,`,
`  const {
    lang,`
);
if (!code.includes('console.log("EVENT CARD", event.titleAr, event.eventRef, user?.isAdmin);')) {
  code = code.replace(
    `const displayAdType = overrideAdType || event.adType;`,
    `const displayAdType = overrideAdType || event.adType;
  console.log("EVENT CARD", event.titleAr, event.eventRef, user?.isAdmin);`
  );
}

fs.writeFileSync('src/components/events/EventCard.tsx', code);
