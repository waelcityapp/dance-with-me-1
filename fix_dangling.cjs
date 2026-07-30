const fs = require('fs');
let content = fs.readFileSync('src/components/events/WeeklyPromoBanner.tsx', 'utf8');

// Find the dangling block
const regex = /\s*\{\/\*\s*Delete button\s*\*\/\}\s*<button[\s\S]*?<\/button>\s*<\/div>\s*<\/div>\s*\)\}/g;
content = content.replace(regex, '');

fs.writeFileSync('src/components/events/WeeklyPromoBanner.tsx', content);

let eventCardContent = fs.readFileSync('src/components/events/EventCard.tsx', 'utf8');
const regex2 = /\s*\{\/\*\s*Delete button\s*\(triggers local confirm\)\s*\*\/\}\s*<button[\s\S]*?<\/button>\s*<\/div>\s*\)\}/g;
eventCardContent = eventCardContent.replace(regex2, '');
fs.writeFileSync('src/components/events/EventCard.tsx', eventCardContent);
console.log('done fixing dangling blocks');
