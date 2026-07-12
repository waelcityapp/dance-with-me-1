const fs = require('fs');
let code = fs.readFileSync('src/components/events/CreateEventPage.tsx', 'utf8');
code = code.replace(/<\/form>\s*<\/motion\.div>\s*\)\}/, '</form>\n        )}\n      </div>');
fs.writeFileSync('src/components/events/CreateEventPage.tsx', code);
