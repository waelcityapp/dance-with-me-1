const fs = require('fs');
let code = fs.readFileSync('src/components/verification/VerificationView.tsx', 'utf8');

code = code.replace(
`  const handleScanSuccess = (decodedText: string) => {
    let extractedId = null;

    try {
      if (decodedText.includes('verify=')) {
        const url = new URL(decodedText.startsWith('http') ? decodedText : window.location.origin + decodedText);
        const param = url.searchParams.get('verify');
        if (param) extractedId = param;
      } else {
        // Not our verify URL. But could be raw ID.
        if (!decodedText.startsWith('http') && decodedText.length > 5 && !decodedText.includes('/')) {
          extractedId = decodedText;
        }
      }
    } catch {
      // fallback
    }

    if (extractedId) {
      setBookingId(extractedId);
      fetchBookingDetails(extractedId);
    } else {
      setError(isArabic ? 'صيغة الباركود غير صالحة ولا يحتوي على تذكرة' : 'Invalid QR code format, no ticket found');
    }
  };`,
`  const handleScanSuccess = (decodedText: string) => {
    let extractedId = decodedText;

    try {
      if (decodedText.includes('verify=')) {
        // Handle absolute URL or relative URL with verify param
        const urlStr = decodedText.startsWith('http') ? decodedText : window.location.origin + (decodedText.startsWith('/') ? '' : '/') + decodedText;
        const url = new URL(urlStr);
        const param = url.searchParams.get('verify');
        if (param) extractedId = param;
      }
    } catch {
      // fallback to just using the decoded text
    }

    setBookingId(extractedId);
    fetchBookingDetails(extractedId);
  };`
);

fs.writeFileSync('src/components/verification/VerificationView.tsx', code);
