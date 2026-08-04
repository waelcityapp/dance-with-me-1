const fs = require('fs');

const path = 'src/lib/firebase.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /authDomain: \(import\.meta as any\)\.env\.VITE_FIREBASE_AUTH_DOMAIN \|\| firebaseConfig\.authDomain,/,
  "authDomain: 'cityeve.online',"
);

fs.writeFileSync(path, content);
console.log('firebase.ts updated');
