const fs = require('fs');
let code = fs.readFileSync('src/components/navbar/Header.tsx', 'utf8');

code = code.replace(
`                onClick={() => window.open('/?verify=scan', '_blank')}`,
`                onClick={() => window.location.href = '/?verify=scan'}`
);

fs.writeFileSync('src/components/navbar/Header.tsx', code);
