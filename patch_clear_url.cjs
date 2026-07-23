const fs = require('fs');
let code = fs.readFileSync('src/components/verification/VerificationView.tsx', 'utf8');

code = code.replace(
`  const handleClearUrl = () => {
    window.history.replaceState({}, document.title, window.location.pathname);
    setActiveTab('explore');
    window.dispatchEvent(new Event('popstate'));
  };`,
`  const handleClearUrl = () => {
    window.location.href = '/';
  };`
);

// We need to fix the button when scanning another QR code.
code = code.replace(
`                      setSuccessMessage(null);
                      setBookingId(null);
                      setBooking(null);
                      setInputRefNumber('');
                      window.history.replaceState({}, document.title, window.location.pathname + '?verify=scan');
                      setActiveTab('verification');
                      setActiveTab('verification');`,
`                      setSuccessMessage(null);
                      setBookingId(null);
                      setBooking(null);
                      setInputRefNumber('');
                      window.history.replaceState({}, document.title, window.location.pathname + '?verify=scan');
                      setActiveTab('verification');`
);

code = code.replace(
`                <div className="flex flex-col gap-2 mt-4">
            <button 
              onClick={() => {
                setError(null);
                setBookingId(null);
                setBooking(null);
                window.history.replaceState({}, document.title, window.location.pathname + '?verify=scan');
                setActiveTab('verification');
              }}`,
`                <div className="flex flex-col gap-2 mt-4">
            <button 
              onClick={() => {
                window.location.href = '/?verify=scan';
              }}`
);

fs.writeFileSync('src/components/verification/VerificationView.tsx', code);
