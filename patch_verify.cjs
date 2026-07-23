const fs = require('fs');
let code = fs.readFileSync('src/components/verification/VerificationView.tsx', 'utf8');

code = code.replace(
`  const handleClearUrl = () => {
    // Clear url query param and return home
    window.history.replaceState({}, document.title, window.location.pathname);
    setActiveTab('explore');
  };`,
`  const handleClearUrl = () => {
    window.location.href = '/';
  };`
);

code = code.replace(
`                      setBookingId(null);
                      setBooking(null);
                      setInputRefNumber('');
                      window.history.replaceState({}, document.title, window.location.pathname);`,
`                      window.location.href = '/?verify=scan';`
);

code = code.replace(
`                      setBookingId(null);
                      setBooking(null);
                      setInputRefNumber('');
                      window.history.replaceState({}, document.title, window.location.pathname);`,
`                      window.location.href = '/?verify=scan';`
);

fs.writeFileSync('src/components/verification/VerificationView.tsx', code);
