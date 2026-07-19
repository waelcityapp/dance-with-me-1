const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

code = code.replace(
`        if (existing && existing.email?.toLowerCase() === cleanEmail) {
          if (parsed.isSuspended) {
            await logoutWithFirebase();
            setUser(null);
            localStorage.removeItem(STORAGE_KEYS.USER);
            return;
          }`,
          `` // wait, is this the right structure? let me check exactly.
);
