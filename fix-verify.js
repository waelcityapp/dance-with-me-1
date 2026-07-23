const fs = require('fs');
let code = fs.readFileSync('src/components/verification/VerificationView.tsx', 'utf8');

// I will just use regex to clean up everything from booking.attended to the end of the file.
const regex = /booking\.attended \? \([\s\S]*?\) : null\}[\s]*<\/div>[\s]*\);[\s]*\};/g;

const replacement = `booking.attended ? (
                <div className="text-center space-y-4 py-2">
                  <div className="text-neutral-500 text-xs font-semibold">
                    {isArabic 
                      ? '🔒 تم تأكيد الدخول وقفل هذه التذكرة مسبقاً.' 
                      : '🔒 Booking check-in is finalized and locked.'}
                  </div>
                  <div className="flex flex-col gap-2 mt-4">
                    <button 
                      onClick={() => {
                        setBookingId(null);
                        setBooking(null);
                        setInputRefNumber('');
                        try {
                          window.history.replaceState({}, document.title, window.location.pathname + '?verify=scan');
                        } catch (e) {}
                      }}
                      className="w-full py-3 bg-neutral-800 text-neutral-200 rounded-xl text-xs font-bold hover:bg-neutral-700 transition-all cursor-pointer"
                    >
                      {isArabic ? 'مسح باركود آخر' : 'Scan another QR code'}
                    </button>
                    <button 
                      onClick={handleClearUrl}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Home className="w-4 h-4" />
                      <span>{isArabic ? 'العودة للصفحة الرئيسية' : 'Return to Home Page'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Security authorization box */}
                  <div className="space-y-2">
                    <label className="text-[11px] text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'التحقق الأمني: أدخل الرقم المرجعي للحدث' : 'Security Check: Enter Event Reference Number'}</span>
                    </label>
                    <input
                      type="password"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={inputRefNumber}
                      onChange={(e) => setInputRefNumber(e.target.value)}
                      placeholder=""
                      className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-center font-mono font-black text-lg text-white tracking-widest focus:border-indigo-500 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Confirm Attendance Button ALWAYS VISIBLE */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isConfirming}
                    onClick={handleConfirmAttendance}
                    className="w-full py-4 bg-emerald-500 text-neutral-950 font-black text-base rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isConfirming ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5" />
                        <span>{isArabic ? 'تأكيد دخول الزائر' : 'Confirm Attendee Check-In'}</span>
                      </>
                    )}
                  </motion.button>

                  {/* Cancel & Return Home button */}
                  <button 
                    type="button"
                    onClick={handleClearUrl}
                    className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                  >
                    <Home className="w-4 h-4 text-amber-400" />
                    <span>{isArabic ? 'إلغاء والعودة للصفحة الرئيسية' : 'Cancel & Return to Home'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
`;
code = code.replace(regex, replacement);
fs.writeFileSync('src/components/verification/VerificationView.tsx', code);
