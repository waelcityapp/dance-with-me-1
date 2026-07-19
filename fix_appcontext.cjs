const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

code = code.replace(/const parsed = JSON\.parse\(stored\);/g, "const parsed = JSON.parse(stored);\n        if (parsed.name && typeof parsed.name === 'object') parsed.name = 'User';");

fs.writeFileSync('src/context/AppContext.tsx', code);
console.log('Fixed local storage parsing');
