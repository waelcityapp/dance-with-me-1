const fs = require('fs');

const path = 'src/components/navbar/Header.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /const shareUrl = typeof window !== 'undefined' \? window\.location\.origin \+ '\/' : 'https:\/\/cityeve\.online\/';/,
  "const shareUrl = 'https://cityeve.online/';"
);

fs.writeFileSync(path, content);
console.log('Header share patched');
