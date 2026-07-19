const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const cleanupRegex = /return \(\) => \{\n      unsubEvents\(\);\n      unsubAssets\(\);/;
const cleanupReplacement = `return () => {
      clearTimeout(loadingTimeout);
      unsubEvents();
      unsubAssets();`;

code = code.replace(cleanupRegex, cleanupReplacement);

fs.writeFileSync('src/context/AppContext.tsx', code);
console.log('Fixed timeout leak');
