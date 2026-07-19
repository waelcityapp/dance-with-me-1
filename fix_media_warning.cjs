const fs = require('fs');
let code = fs.readFileSync('src/components/events/CreateEventPage.tsx', 'utf8');

const securityWarning = `
              <div className="mt-4 p-4 rounded-xl bg-red-950/20 border border-red-500/30">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                  <div className="text-xs text-red-400 font-bold leading-relaxed">
                    {lang === 'ar' ? (
                      <>
                        <p className="text-red-500 font-black mb-1">⚠️ تحذير أمني هام:</p>
                        <p>غير مسموح بإضافة روابط خارجية للصور أو الفيديوهات. يجب رفع الملفات مباشرة من جهازك.</p>
                        <p className="mt-1">يقوم النظام الآلي بفحص جميع الملفات المرفوعة بدقة. يُمنع منعاً باتاً رفع أي ملفات تحتوي على فيروسات، برمجيات خبيثة، أو أكواد ضارة (باتشات). في حال اكتشاف أي مخالفة، سيتم حظر حسابك نهائياً واتخاذ الإجراءات القانونية.</p>
                      </>
                    ) : (
                      <>
                        <p className="text-red-500 font-black mb-1">⚠️ SECURITY WARNING:</p>
                        <p>External media links are not allowed. You must upload files directly from your device.</p>
                        <p className="mt-1">Our automated system rigorously scans all uploaded files. It is strictly prohibited to upload any files containing viruses, malware, or malicious code (patches). Any violation will result in a permanent account ban and legal action.</p>
                      </>
                    )}
                  </div>
                </div>
              </div>`;

code = code.replace(/\{\/\* Visual Media Preview \*\/\}/, securityWarning + '\n\n              {/* Visual Media Preview */}');

fs.writeFileSync('src/components/events/CreateEventPage.tsx', code);
console.log('Fixed media upload rules and added warning part 2.');
