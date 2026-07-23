const fs = require('fs');
let code = fs.readFileSync('src/components/verification/VerificationView.tsx', 'utf8');

code = code.replace(
`  const fetchBookingDetails = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch booking document
      const bookingDocRef = doc(db, 'bookings', id);`,
`  const fetchBookingDetails = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!id || id.includes('/')) {
        setError(isArabic ? '❌ صيغة الباركود غير صالحة ولا يحتوي على بيانات تذكرة صحيحة.' : '❌ Invalid QR code format. Not a valid ticket.');
        setLoading(false);
        return;
      }
      // 1. Fetch booking document
      const bookingDocRef = doc(db, 'bookings', id);`
);

fs.writeFileSync('src/components/verification/VerificationView.tsx', code);
