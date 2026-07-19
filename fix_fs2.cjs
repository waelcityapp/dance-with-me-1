const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

code = code.replace(/const u = \{ \.\.\.uRaw, favoriteStyles: uRaw\.favoriteStyles \|\| \[\] \} as UserProfile;/g, "const u = { ...uRaw, favoriteStyles: uRaw.favoriteStyles || [], likedEventIds: uRaw.likedEventIds || [], bookedEventIds: uRaw.bookedEventIds || [] } as UserProfile;");

code = code.replace(/let selectedUser = \{ \.\.\.raw, favoriteStyles: raw\.favoriteStyles \|\| \[\] \} as UserProfile;/g, "let selectedUser = { ...raw, favoriteStyles: raw.favoriteStyles || [], likedEventIds: raw.likedEventIds || [], bookedEventIds: raw.bookedEventIds || [] } as UserProfile;");

fs.writeFileSync('src/lib/firebase.ts', code);
console.log('Fixed firestore arrays');
