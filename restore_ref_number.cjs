const fs = require('fs');
let code = fs.readFileSync('src/components/verification/VerificationView.tsx', 'utf8');

// Add state back
code = code.replace(
`  // Verification states
  const [isConfirming, setIsConfirming] = useState<boolean>(false);`,
`  // Verification states
  const [inputRefNumber, setInputRefNumber] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState<boolean>(false);`
);

// Add the safety check in handleConfirmAttendance
code = code.replace(
`  const handleConfirmAttendance = async () => {
    if (!booking || !associatedEvent) return;`,
`  const handleConfirmAttendance = async () => {
    if (!booking || !associatedEvent) return;
    
    // Safety check reference number
    const eventRefStr = String(associatedEvent.eventRef || '');
    if (inputRefNumber.trim() !== eventRefStr) {
      alert(
        isArabic
          ? '❌ الرقم المرجعي للحدث غير صحيح! يرجى إدخال الرقم الصحيح المخصص لهذه الحفلة.'
          : '❌ Incorrect Event Reference Number! Please input the authorized code for this event.'
      );
      return;
    }`
);

// Add the UI
code = code.replace(
`              ) : (
                <div className="space-y-4">
                  {/* Confirm Attendance Button */}
                  <motion.button`,
`              ) : (
                <div className="space-y-4">
                  {/* Security authorization box */}
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
                    <motion.button`
);

// Close the conditional button
code = code.replace(
`                      </>
                    )}
                  </motion.button>
                </div>
              )}
            </div>`,
`                      </>
                    )}
                  </motion.button>
                  )}
                </div>
              )}
            </div>`
);

// Re-clear input when scanning another
code = code.replace(
`                      setSuccessMessage(null);
                      setSuccessMessage(null);
                      setBookingId(null);
                      setBooking(null);`,
`                      setSuccessMessage(null);
                      setBookingId(null);
                      setBooking(null);
                      setInputRefNumber('');`
);

code = code.replace(
`                      setBookingId(null);
                      setBooking(null);
                      window.history.replaceState({}, document.title, window.location.pathname + '?verify=scan');`,
`                      setBookingId(null);
                      setBooking(null);
                      setInputRefNumber('');
                      window.history.replaceState({}, document.title, window.location.pathname + '?verify=scan');`
);

fs.writeFileSync('src/components/verification/VerificationView.tsx', code);
