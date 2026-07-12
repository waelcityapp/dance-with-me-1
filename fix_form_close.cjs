const fs = require('fs');
let code = fs.readFileSync('src/components/events/CreateEventPage.tsx', 'utf8');
code = code.replace(/<\/form>\n\s*<\/motion\.div>\n\s*\)\}/, '</form>\n        )}\n      </motion.div>');
fs.writeFileSync('src/components/events/CreateEventPage.tsx', code);
