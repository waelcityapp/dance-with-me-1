const fs = require('fs');
let code = fs.readFileSync('src/components/verification/VerificationView.tsx', 'utf8');

code = code.replace(
`    try {
      const url = new URL(decodedText);`,
`    try {
      const url = new URL(decodedText, window.location.origin);`
);

fs.writeFileSync('src/components/verification/VerificationView.tsx', code);
