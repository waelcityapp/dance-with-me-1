const fs = require('fs');
let code = fs.readFileSync('src/components/navbar/Header.tsx', 'utf8');

code = code.replace(
`                onClick={() => window.location.href = '/?verify=scan'}`,
`                onClick={() => {
                  // If we are already on the site we can just navigate visually
                  window.history.pushState({}, '', '/?verify=scan');
                  // Dispatch a custom event to force the app to re-render or just let the URL params take over
                  window.dispatchEvent(new Event('popstate'));
                }}`
);

fs.writeFileSync('src/components/navbar/Header.tsx', code);
