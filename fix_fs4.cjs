const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

code = code.replace(/const safeUser = \{ \.\.\.user, favoriteStyles: user\.favoriteStyles \|\| \[\], likedEventIds: user\.likedEventIds \|\| \[\], bookedEventIds: user\.bookedEventIds \|\| \[\] \};/g, "const safeUser = { ...user, phone: user.phone || '', avatar: user.avatar || '', name: user.name || '', favoriteStyles: user.favoriteStyles || [], likedEventIds: user.likedEventIds || [], bookedEventIds: user.bookedEventIds || [] };");

fs.writeFileSync('src/lib/firebase.ts', code);
console.log('Fixed firestore save fields');
