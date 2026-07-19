const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

code = code.replace(
`          if (isUserAdmin || existing.isAdmin) {
            existing.isAdmin = true;
          }
          setUser(existing);
          try {
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(existing));
          } catch (e) {}`,
`          const updatedUser = { ...existing, isAdmin: isUserAdmin || existing.isAdmin };
          setUser(updatedUser);
          try {
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
          } catch (e) {}`
);

code = code.replace(
`                if (isUserAdmin) {
                  parsed.isAdmin = true;
                }
                setUser(parsed);`,
`                const updatedParsed = { ...parsed, isAdmin: isUserAdmin || parsed.isAdmin };
                setUser(updatedParsed);`
);

fs.writeFileSync('src/context/AppContext.tsx', code);
console.log('Fixed React user mutation');
