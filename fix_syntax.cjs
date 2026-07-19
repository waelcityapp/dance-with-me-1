const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf8');

code = code.replace(/useState\(false\);\\n/g, 'useState(false);\n');

fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
console.log('Fixed syntax error');
