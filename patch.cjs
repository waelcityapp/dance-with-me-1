const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');
code = code.replace(
  "user.isAdmin || isOrganizer",
  "user.isAdmin || isOrganizer || isAdminUnlocked"
);
code = code.replace(
  "[user, userAdSubmissions?.length]);",
  "[user, userAdSubmissions?.length, isAdminUnlocked]);"
);
fs.writeFileSync('src/context/AppContext.tsx', code);
