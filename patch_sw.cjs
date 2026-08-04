const fs = require('fs');

const path = 'public/sw.js';
let content = fs.readFileSync(path, 'utf8');

// Update cache version
content = content.replace(/const CACHE_VERSION = 'v=20260717';/g, "const CACHE_VERSION = 'v=20260804';");

// Remove icon.svg from core assets
content = content.replace(/,\n  `\/icon\.svg\?\$\{CACHE_VERSION\}`/g, '');

fs.writeFileSync(path, content);
console.log('sw.js updated');
