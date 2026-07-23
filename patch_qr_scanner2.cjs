const fs = require('fs');
let code = fs.readFileSync('src/components/verification/QrScanner.tsx', 'utf8');

code = code.replace(
`            components={{
              audio: false,
              onOff: true,
              torch: true,
              zoom: true,
              finder: true
            }}
            // formats prop removed to allow all formats
          />`,
`          />`
);

fs.writeFileSync('src/components/verification/QrScanner.tsx', code);
