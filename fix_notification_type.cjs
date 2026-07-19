const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf8');

code = code.replace(/export interface NotificationItem \{\n\s+id: string;/, "export interface NotificationItem {\n  id: string;\n  userId?: string;");

fs.writeFileSync('src/types/index.ts', code);
console.log('Fixed NotificationItem type');
