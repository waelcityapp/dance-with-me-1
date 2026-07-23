const fs = require('fs');
let code = fs.readFileSync('src/components/verification/VerificationView.tsx', 'utf8');

code = code.replace(
`  const handleClearUrl = () => {
    window.location.href = '/';
  };`,
`  const handleClearUrl = () => {
    window.history.replaceState({}, document.title, window.location.pathname);
    setActiveTab('explore');
  };`
);

code = code.replace(
`                      window.location.href = '/?verify=scan';`,
`                      setSuccessMessage(null);
                      setBookingId(null);
                      setBooking(null);
                      window.history.replaceState({}, document.title, window.location.pathname + '?verify=scan');`
);

code = code.replace(
`                      window.location.href = '/?verify=scan';`,
`                      setBookingId(null);
                      setBooking(null);
                      window.history.replaceState({}, document.title, window.location.pathname + '?verify=scan');`
);

fs.writeFileSync('src/components/verification/VerificationView.tsx', code);
