const fs = require('fs');
let code = fs.readFileSync('src/components/events/CreateEventPage.tsx', 'utf8');

const urlRegexStr = `/(https?:\\/\\/[^\\s]+)|(www\\.[^\\s]+)|([a-zA-Z0-9-]+\\.(com|net|org|io|me|co|eg|sa|ae|app|link)(?:\\/[^\\s]*)?)/i`;

code = code.replace(/className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 px-4 text-xs sm:text-sm text-white outline-none focus:border-amber-500 transition-colors shadow-inner"/g, 
  `className={\`w-full rounded-xl border \${urlRegex.test(titleAr) ? 'border-red-500 bg-red-950/20' : 'border-neutral-800 bg-neutral-950 focus:border-amber-500'} py-3 px-4 text-xs sm:text-sm text-white outline-none transition-colors shadow-inner\`}`);

// Needs specific replaces for each input
const titleArInput = /value=\{titleAr\}[\s\S]*?onChange=\{e => setTitleAr\(e\.target\.value\)\}[\s\S]*?className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 px-4 text-xs sm:text-sm text-white outline-none focus:border-amber-500 transition-colors shadow-inner"/;
code = code.replace(titleArInput, (match) => {
  return match.replace(/className="[^"]+"/, `className={\`w-full rounded-xl border \${urlRegex.test(titleAr) ? 'border-red-500 bg-red-950/20' : 'border-neutral-800 bg-neutral-950 focus:border-amber-500'} py-3 px-4 text-xs sm:text-sm text-white outline-none transition-colors shadow-inner\`}`);
});

const titleEnInput = /value=\{titleEn\}[\s\S]*?onChange=\{e => setTitleEn\(e\.target\.value\)\}[\s\S]*?className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 px-4 text-xs sm:text-sm text-white outline-none focus:border-amber-500 transition-colors shadow-inner"/;
code = code.replace(titleEnInput, (match) => {
  return match.replace(/className="[^"]+"/, `className={\`w-full rounded-xl border \${urlRegex.test(titleEn) ? 'border-red-500 bg-red-950/20' : 'border-neutral-800 bg-neutral-950 focus:border-amber-500'} py-3 px-4 text-xs sm:text-sm text-white outline-none transition-colors shadow-inner\`}`);
});

const descArInput = /value=\{descAr\}[\s\S]*?onChange=\{e => setDescAr\(e\.target\.value\)\}[\s\S]*?className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 px-4 text-xs sm:text-sm text-white outline-none focus:border-amber-500 transition-colors shadow-inner leading-relaxed"/;
code = code.replace(descArInput, (match) => {
  return match.replace(/className="[^"]+"/, `className={\`w-full rounded-xl border \${urlRegex.test(descAr) ? 'border-red-500 bg-red-950/20' : 'border-neutral-800 bg-neutral-950 focus:border-amber-500'} py-3 px-4 text-xs sm:text-sm text-white outline-none transition-colors shadow-inner leading-relaxed\`}`);
});

const descEnInput = /value=\{descEn\}[\s\S]*?onChange=\{e => setDescEn\(e\.target\.value\)\}[\s\S]*?className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 px-4 text-xs sm:text-sm text-white outline-none focus:border-amber-500 transition-colors shadow-inner leading-relaxed"/;
code = code.replace(descEnInput, (match) => {
  return match.replace(/className="[^"]+"/, `className={\`w-full rounded-xl border \${urlRegex.test(descEn) ? 'border-red-500 bg-red-950/20' : 'border-neutral-800 bg-neutral-950 focus:border-amber-500'} py-3 px-4 text-xs sm:text-sm text-white outline-none transition-colors shadow-inner leading-relaxed\`}`);
});

// Since urlRegex is defined inside useEffect, we need to move it out to the component level to use it in rendering.
const urlRegexUseEffect = /const urlRegex = \/\(https\?:\\\\\/\\\\\/\[\^\\\\s\]\+\)\|\(www\\\\\.\[\^\\\\s\]\+\)\|\(\[a-zA-Z0-9-\]\+\\\\\.\(com\|net\|org\|io\|me\|co\|eg\|sa\|ae\|app\|link\)\(\?:\\\\\/\[\^\\\\s\]\*\)\?\)\/i;/;
code = code.replace(urlRegexUseEffect, '');
const urlRegexGlobal = `
  // Link violation detection
  const urlRegex = /(https?:\\/\\/[^\\s]+)|(www\\.[^\\s]+)|([a-zA-Z0-9-]+\\.(com|net|org|io|me|co|eg|sa|ae|app|link)(?:\\/[^\\s]*)?)/i;
  const [hasUrlViolation, setHasUrlViolation] = useState(false);`;

code = code.replace(/  \/\/ Link violation detection\n  const \[hasUrlViolation, setHasUrlViolation\] = useState\(false\);/, urlRegexGlobal);

fs.writeFileSync('src/components/events/CreateEventPage.tsx', code);
console.log('Fixed inputs styling');
