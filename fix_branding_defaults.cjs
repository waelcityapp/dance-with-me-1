const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace default initial state and fallbacks
  content = content.replace(/'\/icon\.svg(\?v=[0-9]+)?'/g, "'https://res.cloudinary.com/dynasmcaj/image/upload/fbyjfjq8equle5pl7kwz.png'");
  content = content.replace(/"\/icon\.svg(\?v=[0-9]+)?"/g, '"https://res.cloudinary.com/dynasmcaj/image/upload/fbyjfjq8equle5pl7kwz.png"');
  content = content.replace(/'\/logo\.svg'/g, "'https://res.cloudinary.com/dynasmcaj/image/upload/v1785834025/r5uj8nyeht88n4wqdihq.png'");
  content = content.replace(/"\/logo\.svg"/g, '"https://res.cloudinary.com/dynasmcaj/image/upload/v1785834025/r5uj8nyeht88n4wqdihq.png"');

  // Replace fallback app names
  content = content.replace(/appNameAr:\s*'Dance With Me'/g, "appNameAr: 'CityEve'");
  content = content.replace(/appNameEn:\s*'Dance With Me'/g, "appNameEn: 'CityEve'");
  content = content.replace(/"Dance With Me"/g, '"CityEve"');
  content = content.replace(/'Dance With Me'/g, "'CityEve'");
  content = content.replace(/Dance With Me/g, 'CityEve');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.json') || file.endsWith('.html')) {
      replaceInFile(fullPath);
    }
  }
}

walkDir('src');
console.log('Branding defaults replacement complete.');
