const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf-8');
code = code.replace("isExpiredBy15DaysRule?: boolean; // Calculated or manually overridden", "isExpiredBy15DaysRule?: boolean; // Calculated or manually overridden\n  isEmpty?: boolean;");
fs.writeFileSync('src/types/index.ts', code);
