const fs = require('fs');
let code = fs.readFileSync('src/components/verification/VerificationView.tsx', 'utf8');

code = code.replace(
`  const handleScanSuccess = (decodedText: string) => {
    try {
      const url = new URL(decodedText, window.location.origin);
      const verifyId = url.searchParams.get('verify');
      if (verifyId) {
        setBookingId(verifyId);
        fetchBookingDetails(verifyId);
      } else {
        setError(isArabic ? 'صيغة الباركود غير صالحة' : 'Invalid QR code format');
      }
    } catch {
      // If it's not a URL, maybe it's just the booking ID
      if (decodedText && decodedText.length > 5) {
        setBookingId(decodedText);
        fetchBookingDetails(decodedText);
      } else {
        setError(isArabic ? 'صيغة الباركود غير صالحة' : 'Invalid QR code format');
      }
    }
  };`,
`  const handleScanSuccess = (decodedText: string) => {
    let extractedId = decodedText;

    try {
      if (decodedText.includes('verify=')) {
        // Handle absolute URL or relative URL with verify param
        const url = new URL(decodedText.startsWith('http') ? decodedText : window.location.origin + decodedText);
        const param = url.searchParams.get('verify');
        if (param) extractedId = param;
      }
    } catch {
      // If URL parsing fails, fallback to raw text
    }

    if (extractedId && extractedId.length > 5) {
      setBookingId(extractedId);
      fetchBookingDetails(extractedId);
    } else {
      setError(isArabic ? 'صيغة الباركود غير صالحة' : 'Invalid QR code format');
    }
  };`
);

fs.writeFileSync('src/components/verification/VerificationView.tsx', code);
