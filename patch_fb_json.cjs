const fs = require('fs');
let content = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
content.authDomain = "cityeve.online";
fs.writeFileSync('firebase-applet-config.json', JSON.stringify(content, null, 2));
console.log('firebase-applet-config.json updated');
