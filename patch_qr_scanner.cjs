const fs = require('fs');
let code = fs.readFileSync('src/components/verification/QrScanner.tsx', 'utf8');

code = code.replace(
`            onError={(err: any) => {
              if (onScanFailure) {
                onScanFailure(err?.message || 'Error scanning');
              }
            }}`,
`            onError={(err: any) => {
              // We ignore continuous scan errors as they happen on every frame without a QR code
              // Only log them in dev if needed
            }}
            components={{
              audio: false,
              onOff: true,
              torch: true,
              zoom: true,
              finder: true
            }}`
);

code = code.replace(
`      <div className="w-full max-w-sm rounded-2xl overflow-hidden border-2 border-neutral-800 bg-neutral-900 aspect-square relative">`,
`      <div className="w-full max-w-sm rounded-2xl overflow-hidden border-2 border-amber-500/30 bg-black aspect-square relative shadow-lg shadow-amber-500/10">`
);

fs.writeFileSync('src/components/verification/QrScanner.tsx', code);
