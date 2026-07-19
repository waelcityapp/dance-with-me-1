const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

code = code.replace(/await setDoc\(docRef, user, { merge: true }\);/g, "const safeUser = { ...user, favoriteStyles: user.favoriteStyles || [] };\n    await setDoc(docRef, safeUser, { merge: true });");

code = code.replace(/let selectedUser = snap\.docs\[0\]\.data\(\) as UserProfile;/g, "let raw = snap.docs[0].data();\n      let selectedUser = { ...raw, favoriteStyles: raw.favoriteStyles || [] } as UserProfile;");

code = code.replace(/const u = docSnap\.data\(\) as UserProfile;/g, "const uRaw = docSnap.data();\n        const u = { ...uRaw, favoriteStyles: uRaw.favoriteStyles || [] } as UserProfile;");

fs.writeFileSync('src/lib/firebase.ts', code);
console.log('Fixed firestore user save/load');
