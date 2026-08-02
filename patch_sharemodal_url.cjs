const fs = require('fs');

const path = 'src/components/modals/ShareModal.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /const shareUrl = window\.location\.href;/,
  "const shareUrl = 'https://cityeve.online/';"
);

fs.writeFileSync(path, content);
console.log('ShareModal patched');
