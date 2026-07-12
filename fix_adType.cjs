const fs = require('fs');
let code = fs.readFileSync('src/components/events/CreateEventPage.tsx', 'utf8');
code = code.replace('{{adType && (\\n        <>', '{adType && (\n        <>');
fs.writeFileSync('src/components/events/CreateEventPage.tsx', code);
