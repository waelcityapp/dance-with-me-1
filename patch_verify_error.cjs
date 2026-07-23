const fs = require('fs');
let code = fs.readFileSync('src/components/verification/VerificationView.tsx', 'utf8');

code = code.replace(
`          <button 
            onClick={handleClearUrl}
            className="w-full py-3 bg-neutral-900 text-neutral-400 rounded-xl text-xs font-bold hover:text-white transition-all cursor-pointer mt-2"
          >
            {isArabic ? 'العودة للرئيسية' : 'Return to Home'}
          </button>
        </div>
      ) : !bookingId ? (`,
`          <div className="flex flex-col gap-2 mt-4">
            <button 
              onClick={() => {
                setError(null);
                setBookingId(null);
                setBooking(null);
                window.history.replaceState({}, document.title, window.location.pathname + '?verify=scan');
                setActiveTab('verification');
              }}
              className="w-full py-3 bg-red-500/20 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500/30 transition-all cursor-pointer"
            >
              {isArabic ? 'مسح باركود آخر' : 'Scan another QR code'}
            </button>
            <button 
              onClick={handleClearUrl}
              className="w-full py-3 bg-neutral-900 text-neutral-400 rounded-xl text-xs font-bold hover:text-white transition-all cursor-pointer"
            >
              {isArabic ? 'العودة للرئيسية' : 'Return to Home'}
            </button>
          </div>
        </div>
      ) : !bookingId ? (`
);

fs.writeFileSync('src/components/verification/VerificationView.tsx', code);
