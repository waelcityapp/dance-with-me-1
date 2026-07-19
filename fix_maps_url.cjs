const fs = require('fs');
let code = fs.readFileSync('src/components/events/CreateEventPage.tsx', 'utf8');

// Add mapsUrlError state
const stateSection = /const \[hasUrlViolation, setHasUrlViolation\] = useState\(false\);/;
const stateReplacement = `const [hasUrlViolation, setHasUrlViolation] = useState(false);
  const [mapsUrlError, setMapsUrlError] = useState(false);`;
code = code.replace(stateSection, stateReplacement);

// Add useEffect for google maps url validation
const useEffectSection = /setHasUrlViolation\(hasViolation\);\n  \}, \[titleAr, titleEn, descAr, descEn\]\);/;
const useEffectReplacement = `setHasUrlViolation(hasViolation);
  }, [titleAr, titleEn, descAr, descEn]);

  React.useEffect(() => {
    if (googleMapsUrl && googleMapsUrl.trim() !== '') {
      const mapsRegex = /(https?:\\/\\/)?(www\\.)?(google\\.com\\/maps|maps\\.google\\.com|goo\\.gl\\/maps|maps\\.app\\.goo\\.gl)/i;
      setMapsUrlError(!mapsRegex.test(googleMapsUrl));
    } else {
      setMapsUrlError(false);
    }
  }, [googleMapsUrl]);`;
code = code.replace(useEffectSection, useEffectReplacement);

// Fix duplicate urlRegex
code = code.replace(/    \/\/ Only block URLs in text fields, not in the mediaUrl or googleMapsUrl\n    const urlRegex = \/\(https\?:\\\\\/\\\\\/\[\^\\\\s\]\+\)\|\(www\\\\\.\[\^\\\\s\]\+\)\|\(\[a-zA-Z0-9-\]\+\\\\\.\(com\|net\|org\|io\|me\|co\|eg\|sa\|ae\|app\|link\)\(\?:\\\\\/\[\^\\\\s\]\*\)\?\)\/i;\n/g, '    // Only block URLs in text fields, not in the mediaUrl or googleMapsUrl\n');

// Block submission if mapsUrlError is true
code = code.replace(/disabled=\{\!agreedToTerms \|\| hasUrlViolation\}/g, "disabled={!agreedToTerms || hasUrlViolation || mapsUrlError}");
code = code.replace(/disabled=\{\!agreedToTerms \|\| isUploadingMedia \|\| hasUrlViolation\}/g, "disabled={!agreedToTerms || isUploadingMedia || hasUrlViolation || mapsUrlError}");
code = code.replace(/if \(\!agreedToTerms \|\| hasUrlViolation\) return;/g, "if (!agreedToTerms || hasUrlViolation || mapsUrlError) return;");
code = code.replace(/if \(\!agreedToTerms \|\| isUploadingMedia \|\| hasUrlViolation\) return;/g, "if (!agreedToTerms || isUploadingMedia || hasUrlViolation || mapsUrlError) return;");

// Fix the input rendering to show error state
const inputSection = /className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 px-4 text-xs sm:text-sm font-mono text-white outline-none focus:border-amber-500"/;
const inputReplacement = `className={\`w-full rounded-xl border \${mapsUrlError ? 'border-red-500 bg-red-950/20' : 'border-neutral-800 bg-neutral-950 focus:border-amber-500'} py-3 px-4 text-xs sm:text-sm font-mono text-white outline-none transition-colors shadow-inner\`}`;
code = code.replace(inputSection, inputReplacement);

// Add the warning text below the input
const pSection = /<p className="mt-1\.5 text-\[11px\] text-neutral-400 leading-relaxed font-sans">/;
const pReplacement = `{mapsUrlError && (
                <p className="mt-2 text-xs font-bold text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {lang === 'ar' ? 'هذا الرابط غير صحيح. يجب أن يكون رابطاً رسمياً من خرائط جوجل.' : 'Invalid link. Must be an official Google Maps link.'}
                </p>
              )}
              <p className="mt-1.5 text-[11px] text-neutral-400 leading-relaxed font-sans">`;
code = code.replace(pSection, pReplacement);

fs.writeFileSync('src/components/events/CreateEventPage.tsx', code);
console.log('Fixed google maps URL validation');
