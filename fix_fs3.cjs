const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

code = code.replace(/const safeUser = \{ \.\.\.user, favoriteStyles: user\.favoriteStyles \|\| \[\] \};/g, "const safeUser = { ...user, favoriteStyles: user.favoriteStyles || [], likedEventIds: user.likedEventIds || [], bookedEventIds: user.bookedEventIds || [] };");

fs.writeFileSync('src/lib/firebase.ts', code);
console.log('Fixed firestore save arrays');
