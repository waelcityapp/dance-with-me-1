const fs = require('fs');
let code = fs.readFileSync('src/components/verification/VerificationView.tsx', 'utf8');

const regex = /booking\.attended \? \([\s\S]*?\) : null\}[\s]*<\/div>[\s]*\);[\s]*\};/g;

// Instead of the regex, let's just find where it starts being wrong.
const parts = code.split(') : booking ? (');
let correctPart1 = parts[0] + ') : booking ? (\n';

let correctPart2 = `        <div className="space-y-6">
          {/* Ticket status badge */}
          <div className="flex items-center justify-center">
            {booking.attended ? (
              <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold text-xs">
                  {isArabic ? 'تم تأكيد الحضور مسبقاً' : 'Already Checked-in'}
                </span>
              </div>
            ) : booking.status === 'approved' ? (
              <div className="px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-400 font-bold text-xs">
                  {isArabic ? 'تذكرة معتمدة جاهزة للدخول' : 'Valid Ticket Ready'}
                </span>
              </div>
            ) : (
              <div className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-full flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-bold text-xs">
                  {isArabic ? 'التذكرة غير معتمدة' : 'Ticket not approved'}
                </span>
              </div>
            )}
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-md">
            <div className="p-5 space-y-4">
              {/* Event title info */}
              <div className="border-b border-neutral-800/50 pb-3">
                <h3 className="text-base font-bold text-white">
                  {isArabic ? booking.eventTitleAr : booking.eventTitleEn}
                </h3>
              </div>
              
              {/* Grid ticket data */}
              <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
                <div>
                  <span className="text-neutral-500 block uppercase tracking-wider text-[10px]">
                    {isArabic ? '👤 اسم صاحب الحجز' : '👤 BOOKER NAME'}
                  </span>
                  <span className="text-white font-extrabold block mt-0.5">{booking.userName}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block uppercase tracking-wider text-[10px]">
                    {isArabic ? '📞 رقم الهاتف' : '📞 PHONE NUMBER'}
                  </span>
                  <span className="text-neutral-300 font-mono font-bold block mt-0.5">{booking.userPhone}</span>
                </div>
                <div className="border-t border-neutral-800/60 pt-3">
                  <span className="text-neutral-500 block uppercase tracking-wider text-[10px]">
                    {isArabic ? '👥 عدد الحاضرين' : '👥 GUESTS COUNT'}
                  </span>
                  <span className="text-white font-extrabold block text-sm mt-0.5">
                    {booking.numberOfIndividuals} {isArabic ? 'أفراد' : 'people'}
                  </span>
                </div>
                <div className="border-t border-neutral-800/60 pt-3">
                  <span className="text-neutral-500 block uppercase tracking-wider text-[10px]">
                    {isArabic ? '💰 المبلغ المستحق' : '💰 TOTAL PAID AMOUNT'}
                  </span>
                  <span className="text-amber-400 font-mono font-black block text-sm mt-0.5">
                    {booking.totalAmount} {isArabic ? 'ج.م' : 'EGP'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom confirmation verification details */}
            <div className="p-5 bg-neutral-950/40 border-t border-neutral-800/50">
              {successMessage ? (
                <div className="text-center space-y-4 py-2">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                  <p className="text-xs font-bold text-emerald-400 leading-relaxed">{successMessage}</p>
                  <button 
                    onClick={() => {
                      window.location.href = '/?verify=scan';
                    }}
                    className="w-full py-3 mt-4 bg-neutral-800 text-neutral-200 rounded-xl text-xs font-bold hover:bg-neutral-700 transition-all cursor-pointer"
                  >
                    {isArabic ? 'مسح باركود آخر' : 'Scan another QR code'}
                  </button>
                </div>
              ) : booking.attended ? (
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

fs.writeFileSync('src/components/verification/VerificationView.tsx', correctPart1 + correctPart2);
