const fs = require('fs');
console.log(fs.readFileSync('src/context/AppContext.tsx', 'utf8').match(/isUserAdmin/g).length);
