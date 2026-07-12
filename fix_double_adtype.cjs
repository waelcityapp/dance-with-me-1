const fs = require('fs');
let code = fs.readFileSync('src/components/events/CreateEventPage.tsx', 'utf8');
code = code.replace(/\{\s*adType && \(\s*<form onSubmit=\{handleProceedToPayment\} className="space-y-6">/, '<form onSubmit={handleProceedToPayment} className="space-y-6">');
fs.writeFileSync('src/components/events/CreateEventPage.tsx', code);
