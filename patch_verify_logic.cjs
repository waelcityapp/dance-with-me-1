const fs = require('fs');
let code = fs.readFileSync('src/components/verification/VerificationView.tsx', 'utf8');

code = code.replace(
`  // Verification states
  const [inputRefNumber, setInputRefNumber] = useState<string>('');`,
`  // Verification states`
);

code = code.replace(
`    // Safety check reference number
    const eventRefStr = String(associatedEvent.eventRef || '');
    if (inputRefNumber.trim() !== eventRefStr) {
      alert(
        isArabic
          ? '❌ الرقم المرجعي للحدث غير صحيح! يرجى إدخال الرقم الصحيح المخصص لهذه الحفلة.'
          : '❌ Incorrect Event Reference Number! Please input the authorized code for this event.'
      );
      return;
    }`,
``
);

code = code.replace(
`                  {/* Security authorization box */}
                  <div className="space-y-2">
                    <label className="text-[11px] text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'التحقق الأمني: أدخل الرقم المرجعي للحدث' : 'Security Check: Enter Event Reference Number'}</span>
                    </label>
                    <input
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={inputRefNumber}
                      onChange={(e) => setInputRefNumber(e.target.value)}
                      placeholder={isArabic ? 'مثال: 1001' : 'e.g. 1001'}
                      className="w-full px-4 py-3 bg-neutral-900 border-2 border-neutral-800 rounded-xl text-center font-mono font-black text-lg text-white tracking-widest focus:border-indigo-500 focus:outline-none transition-all"
                    />
                    <p className="text-[10px] text-neutral-500 text-center font-sans">
                      {isArabic 
                        ? 'ملاحظة: الرقم المرجعي متاح في تفاصيل الإعلان للأدمن والمنظم المعتمد.' 
                        : 'Note: The Reference Number is displayed under the ad card to Admin and organizers.'}
                    </p>
                  </div>

                  {/* Confirm Attendance Button */}
                  {inputRefNumber.trim() === String(associatedEvent?.eventRef || '') && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isConfirming}
                      onClick={handleConfirmAttendance}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-neutral-950 font-black text-sm rounded-xl hover:from-emerald-400 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isConfirming ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <ShieldCheck className="w-5 h-5" />
                          <span>{isArabic ? 'تأكيد الحضور والدخول بوابة الدخول' : 'Confirm Attendee Check-In'}</span>
                        </>
                      )}
                    </motion.button>
                  )}`,
`                  {/* Confirm Attendance Button */}
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
                  </motion.button>`
);

// We need to also remove setInputRefNumber from the rest of the code.
code = code.replace(/setInputRefNumber\(''\);\s*/g, '');

fs.writeFileSync('src/components/verification/VerificationView.tsx', code);
