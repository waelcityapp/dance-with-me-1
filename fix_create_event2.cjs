const fs = require('fs');
let code = fs.readFileSync('src/components/events/CreateEventPage.tsx', 'utf8');

// Replace the previous urlRegex implementation with a more precise one
code = code.replace(/const urlRegex = \/\(https\?:\\\\\/\\\\\/\[\^\\\\s\]\+\)\|\(www\\\\\.\[\^\\\\s\]\+\)\|\(\[a-zA-Z0-9-\]\+\\\\\.\(com\|net\|org\|io\|me\|co\|eg\|sa\|ae\|app\|link\)\(\?:\\\\\/\[\^\\\\s\]\*\)\?\)\/i;/g, 
  "const urlRegex = /(https?:\\/\\/[^\\s]+)|(www\\.[^\\s]+)|([a-zA-Z0-9-]+\\.(com|net|org|io|me|co|eg|sa|ae|app|link)(?:\\/[^\\s]*)?)/i;");

// Find where to insert the red banner and how to block the action buttons.
// Let's insert the warning right above the Actions Button Section (around line 1850).
const actionsRegex = /\{\/\* Actions Button Section \*\/\}/;
const warningBanner = `
          {hasUrlViolation && (
            <div className="mb-6 p-5 rounded-2xl bg-red-500/10 border-2 border-red-500/40 animate-pulse shadow-xl shadow-red-500/10">
              <div className="flex flex-col items-center justify-center text-center gap-3">
                <ShieldCheck className="h-10 w-10 text-red-500" />
                <h3 className="text-lg font-black text-red-500">
                  {lang === 'ar' ? '⚠️ تحذير أمني: يمنع منعاً باتاً إضافة روابط خارجية' : '⚠️ Security Warning: External Links Strictly Prohibited'}
                </h3>
                <p className="text-sm font-bold text-red-400 max-w-lg leading-relaxed">
                  {lang === 'ar' 
                    ? 'لقد اكتشف نظام الحماية وجود رابط خارجي في العنوان أو الوصف. لقد تم إيقاف وإغلاق كافة أزرار المعاينة والنشر فوراً.' 
                    : 'The security system has detected an external link in the title or description. All preview and publish buttons have been immediately disabled.'}
                </p>
                <p className="text-xs font-bold text-neutral-400 mt-2 bg-neutral-950 px-4 py-2 rounded-xl border border-red-500/20">
                  {lang === 'ar' 
                    ? 'تنبيه: تكرار هذه المخالفة سيؤدي إلى إرسال تقرير فوري إلى إدارة التطبيق لاتخاذ الإجراءات القانونية اللازمة وحظر حسابك نهائياً.' 
                    : 'Notice: Repeating this violation will result in an immediate report to the app administration for legal action and permanent account ban.'}
                </p>
              </div>
            </div>
          )}
          {/* Actions Button Section */}`;

code = code.replace(actionsRegex, warningBanner);

// Now update the disabled state and styling for the action buttons
code = code.replace(/disabled=\{\!agreedToTerms \|\| isUploadingMedia\}/g, "disabled={!agreedToTerms || isUploadingMedia || hasUrlViolation}");
code = code.replace(/whileHover=\{agreedToTerms \&\& \!isUploadingMedia \? \{ scale: 1\.01 \} : \{\}\}/g, "whileHover={agreedToTerms && !isUploadingMedia && !hasUrlViolation ? { scale: 1.01 } : {}}");
code = code.replace(/whileTap=\{agreedToTerms \&\& \!isUploadingMedia \? \{ scale: 0\.98 \} : \{\}\}/g, "whileTap={agreedToTerms && !isUploadingMedia && !hasUrlViolation ? { scale: 0.98 } : {}}");
code = code.replace(/className=\{\`w-full sm:w-auto min-w-\[280px\] rounded-2xl py-3 px-8 text-sm font-extrabold transition-all flex items-center justify-center gap-3 border \$\{[\s\S]*?agreedToTerms \&\& \!isUploadingMedia[\s\S]*?\? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-neutral-950 hover:from-amber-400 hover:to-amber-500 shadow-2xl gold-glow border-amber-300\/40 cursor-pointer'[\s\S]*?: 'bg-neutral-800\/80 text-neutral-500 border-neutral-700\/60 cursor-not-allowed opacity-60'[\s\S]*?\}\`\}/g,
  `className={\`w-full sm:w-auto min-w-[280px] rounded-2xl py-3 px-8 text-sm font-extrabold transition-all flex items-center justify-center gap-3 border \${
                    hasUrlViolation
                      ? 'hidden pointer-events-none'
                      : agreedToTerms && !isUploadingMedia
                      ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-neutral-950 hover:from-amber-400 hover:to-amber-500 shadow-2xl gold-glow border-amber-300/40 cursor-pointer'
                      : 'bg-neutral-800/80 text-neutral-500 border-neutral-700/60 cursor-not-allowed opacity-60'
                  }\`}`);

// Same for the non-editing (preview) button
code = code.replace(/disabled=\{\!agreedToTerms\}/g, "disabled={!agreedToTerms || hasUrlViolation}");
code = code.replace(/whileHover=\{agreedToTerms \? \{ scale: 1\.01 \} : \{\}\}/g, "whileHover={agreedToTerms && !hasUrlViolation ? { scale: 1.01 } : {}}");
code = code.replace(/whileTap=\{agreedToTerms \? \{ scale: 0\.98 \} : \{\}\}/g, "whileTap={agreedToTerms && !hasUrlViolation ? { scale: 0.98 } : {}}");
code = code.replace(/className=\{\`w-full sm:w-auto min-w-\[280px\] rounded-2xl py-3 px-8 text-sm font-extrabold transition-all flex items-center justify-center gap-3 border \$\{[\s\S]*?agreedToTerms[\s\S]*?\? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-neutral-950 hover:from-amber-400 hover:to-amber-500 shadow-2xl gold-glow border-amber-300\/40 cursor-pointer'[\s\S]*?: 'bg-neutral-800\/80 text-neutral-500 border-neutral-700\/60 cursor-not-allowed opacity-60'[\s\S]*?\}\`\}/g,
  `className={\`w-full sm:w-auto min-w-[280px] rounded-2xl py-3 px-8 text-sm font-extrabold transition-all flex items-center justify-center gap-3 border \${
                    hasUrlViolation
                      ? 'hidden pointer-events-none'
                      : agreedToTerms
                      ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-neutral-950 hover:from-amber-400 hover:to-amber-500 shadow-2xl gold-glow border-amber-300/40 cursor-pointer'
                      : 'bg-neutral-800/80 text-neutral-500 border-neutral-700/60 cursor-not-allowed opacity-60'
                  }\`}`);

code = code.replace(/if \(\!agreedToTerms\) return;/g, "if (!agreedToTerms || hasUrlViolation) return;");
code = code.replace(/if \(\!agreedToTerms \|\| isUploadingMedia\) return;/g, "if (!agreedToTerms || isUploadingMedia || hasUrlViolation) return;");

fs.writeFileSync('src/components/events/CreateEventPage.tsx', code);
console.log('Fixed URL violation handling and banner');
