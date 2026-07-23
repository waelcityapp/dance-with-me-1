const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
`        {new URLSearchParams(window.location.search).get('verify') ? (
          <VerificationView />
        ) : (`,
`        {activeTab === 'verification' || new URLSearchParams(window.location.search).get('verify') ? (
          <VerificationView />
        ) : (`
);

fs.writeFileSync('src/App.tsx', code);
