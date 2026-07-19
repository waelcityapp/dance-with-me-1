const fs = require('fs');
let code = fs.readFileSync('src/components/events/CreateEventPage.tsx', 'utf8');

const regex = /const \[previewAlert, setPreviewAlert\] = useState<string \| null>\(null\);/;

const replacement = `const [previewAlert, setPreviewAlert] = useState<string | null>(null);

  // Link violation detection
  const [hasUrlViolation, setHasUrlViolation] = useState(false);
  
  React.useEffect(() => {
    // Only block URLs in text fields, not in the mediaUrl or googleMapsUrl
    const urlRegex = /(https?:\\/\\/[^\\s]+)|(www\\.[^\\s]+)|([a-zA-Z0-9-]+\\.(com|net|org|io|me|co|eg|sa|ae|app|link)(?:\\/[^\\s]*)?)/i;
    const hasViolation = [titleAr, titleEn, descAr, descEn].some(text => urlRegex.test(text));
    setHasUrlViolation(hasViolation);
  }, [titleAr, titleEn, descAr, descEn]);`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/events/CreateEventPage.tsx', code);
console.log('Added URL violation state');
