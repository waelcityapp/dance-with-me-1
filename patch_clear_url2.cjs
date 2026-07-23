const fs = require('fs');
let code = fs.readFileSync('src/components/verification/VerificationView.tsx', 'utf8');

code = code.replace(
`                      setSuccessMessage(null);
                      setBookingId(null);
                      setBooking(null);
                      setInputRefNumber('');
                      window.history.replaceState({}, document.title, window.location.pathname + '?verify=scan');
                      setActiveTab('verification');`,
`                      window.location.href = '/?verify=scan';`
);

code = code.replace(
`                    onClick={() => {
                      setBookingId(null);
                      setBooking(null);
                      window.history.replaceState({}, document.title, window.location.pathname + '?verify=scan');
                    }}`,
`                    onClick={() => {
                      window.location.href = '/?verify=scan';
                    }}`
);

fs.writeFileSync('src/components/verification/VerificationView.tsx', code);
