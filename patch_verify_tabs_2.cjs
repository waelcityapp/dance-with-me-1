const fs = require('fs');
let code = fs.readFileSync('src/components/verification/VerificationView.tsx', 'utf8');

code = code.replace(
`  const handleClearUrl = () => {
    window.history.replaceState({}, document.title, window.location.pathname);
    setActiveTab('explore');
  };`,
`  const handleClearUrl = () => {
    window.history.replaceState({}, document.title, window.location.pathname);
    setActiveTab('explore');
    window.dispatchEvent(new Event('popstate'));
  };`
);

code = code.replace(
`                      setBookingId(null);
                      setBooking(null);
                      window.history.replaceState({}, document.title, window.location.pathname + '?verify=scan');`,
`                      setBookingId(null);
                      setBooking(null);
                      window.history.replaceState({}, document.title, window.location.pathname + '?verify=scan');
                      setActiveTab('verification');`
);

code = code.replace(
`                      setSuccessMessage(null);
                      setBookingId(null);
                      setBooking(null);
                      window.history.replaceState({}, document.title, window.location.pathname + '?verify=scan');`,
`                      setSuccessMessage(null);
                      setBookingId(null);
                      setBooking(null);
                      window.history.replaceState({}, document.title, window.location.pathname + '?verify=scan');
                      setActiveTab('verification');`
);

fs.writeFileSync('src/components/verification/VerificationView.tsx', code);
