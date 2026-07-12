const fs = require('fs');
let code = fs.readFileSync('src/components/events/CreateEventPage.tsx', 'utf8');
code = code.replace(/<\/form>\n\s*<\/>\n\s*\)\}\n\s*<\/motion\.div>/, '</form>\n        </>\n        )}\n      </motion.div>\n      )}');
fs.writeFileSync('src/components/events/CreateEventPage.tsx', code);
