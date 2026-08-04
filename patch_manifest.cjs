const fs = require('fs');

// 1. Update manifest.json
const manifestPath = 'public/manifest.json';
let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.icons = [
  {
    "src": "https://res.cloudinary.com/dynasmcaj/image/upload/fbyjfjq8equle5pl7kwz.png",
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "any maskable"
  }
];
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('manifest.json updated');

// 2. Update index.html version parameters to force cache refresh
let indexHtml = fs.readFileSync('index.html', 'utf8');
const newVersion = '20260804';
indexHtml = indexHtml.replace(/v=20260717/g, 'v=' + newVersion);
fs.writeFileSync('index.html', indexHtml);
console.log('index.html cache busting version updated');

