const fs = require('fs');
let path = 'src/components/modals/ShareModal.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(
  "const shareUrl = 'https://cityeve.online/';",
  "const shareUrl = `https://cityeve.online/?event=${event.id}`;"
);
fs.writeFileSync(path, content);
console.log('ShareModal updated');
