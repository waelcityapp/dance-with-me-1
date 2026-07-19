const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

code = code.replace(/let raw = snap\.docs\[0\]\.data\(\);/g, "let raw = snap.docs[0].data();\n      if (raw.name && typeof raw.name === 'object') raw.name = 'User';\n      if (raw.phone && typeof raw.phone === 'object') raw.phone = '';");

code = code.replace(/const uRaw = docSnap\.data\(\);/g, "const uRaw = docSnap.data();\n        if (uRaw.name && typeof uRaw.name === 'object') uRaw.name = 'User';\n        if (uRaw.phone && typeof uRaw.phone === 'object') uRaw.phone = '';");

fs.writeFileSync('src/lib/firebase.ts', code);
console.log('Fixed firestore parsing');
