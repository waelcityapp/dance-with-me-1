const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

content = content.replace(
  /<meta property="og:image" content="[^"]+" \/>/,
  '<meta property="og:image" content="https://cityeve.online/cityeve-cover.png" />'
);
content = content.replace(
  /<meta name="twitter:image" content="[^"]+" \/>/,
  '<meta name="twitter:image" content="https://cityeve.online/cityeve-cover.png" />'
);
// Also add standard meta image if not present
if (!content.includes('<meta itemprop="image"')) {
  content = content.replace(
    /<\/title>/,
    '</title>\n    <meta itemprop="image" content="https://cityeve.online/cityeve-cover.png" />'
  );
}

fs.writeFileSync('index.html', content);
console.log('index.html updated');
