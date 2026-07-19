const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf8');

code = code.replace(/export interface AdSubmission \{\n\s+id: string;/, "export interface AdSubmission {\n  id: string;\n  eventRef?: number;");

fs.writeFileSync('src/types/index.ts', code);
console.log('Fixed AdSubmission type');
