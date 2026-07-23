import React, { useState } from 'react';
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { useApp } from '../../context/AppContext';
import { Camera, AlertCircle, Key, Upload, ExternalLink } from 'lucide-react';

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: string) => void;
  onSwitchToManual?: () => void;
  onSwitchToUpload?: () => void;
}

export const QrScanner: React.FC<QrScannerProps> = ({ 
  onScanSuccess, 
  onScanFailure,
  onSwitchToManual,
  onSwitchToUpload
}) => {
  const { lang } = useApp();
  const isArabic = lang === 'ar';

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  const handleScan = (detectedCodes: IDetectedBarcode[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      onScanSuccess(detectedCodes[0].rawValue);
    }
  };

  const handleError = (error: any) => {
    console.error('QR Scanner Error:', error);
    const errString = String(error?.message || error?.name || error);
    if (errString.includes('NotAllowedError') || errString.includes('PermissionDeniedError') || errString.includes('Permission denied')) {
      setHasPermission(false);
    } else {
      setErrorMsg(
        isArabic 
          ? '⚠️ تعذر تشغيل الكاميرا. يمكنك استخدام الإدخال اليدوي أو فتح التطبيق في نافذة جديدة.' 
          : '⚠️ Could not access camera. Try manual code entry or open in a new window.'
      );
    }
  };

  const standaloneUrl = window.location.origin + '/?verify=scan';

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-4">
      {/* Main scanner container */}
      <div className="w-full max-w-sm rounded-3xl overflow-hidden border-2 border-amber-500/30 bg-neutral-950 aspect-square relative shadow-2xl shadow-amber-500/10 flex flex-col items-center justify-center">
        
        {/* Permission Denied UI */}
        {hasPermission === false && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-950 p-3.5 text-center space-y-2 overflow-y-auto">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            
            <div className="space-y-1">
              <h4 className="text-xs font-black text-white">
                {isArabic ? 'تفعيل إذن الكاميرا' : 'Camera Access Setup'}
              </h4>
              <p className="text-[10px] text-neutral-300 leading-snug font-sans max-w-[250px]">
                {isArabic 
                  ? 'يرجى السماح باستخدام الكاميرا من المتصفح أو اتبع خطوات الإعداد:' 
                  : 'Please allow camera access in your browser or follow settings steps:'}
              </p>
            </div>

            {/* Toggleable Browser Settings Guidance */}
            {showGuide ? (
              <div className="w-full max-w-[260px] bg-neutral-900/90 border border-neutral-800 rounded-xl p-2.5 text-right text-[10px] space-y-1.5 text-neutral-300">
                <p className="font-bold text-amber-400 border-b border-neutral-800 pb-1 text-center">
                  {isArabic ? '⚙️ طريقة السماح بالكاميرا:' : '⚙️ How to enable camera:'}
                </p>
                <div className="space-y-1 font-sans text-[9.5px]">
                  <p>• <b>Chrome / Edge:</b> اضغط على أيقونة القفل 🔒 بجانب الرابط ➔ الكاميرا ➔ سماح (Allow).</p>
                  <p>• <b>Safari / iOS:</b> اضغط على AA أو القفل ➔ إعدادات الموقع ➔ الكاميرا ➔ سماح.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  className="w-full mt-1 py-1 bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-bold rounded text-[9px]"
                >
                  {isArabic ? 'إغلاق التعليمات' : 'Hide Instructions'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowGuide(true)}
                className="text-[10px] text-amber-400 underline hover:text-amber-300 font-bold"
              >
                {isArabic ? '💡 كيف أفعّل إذن الكاميرا في متصفحي؟' : '💡 How to allow camera in my browser?'}
              </button>
            )}

            <div className="flex flex-col gap-1.5 w-full max-w-[250px] pt-1">
              {/* Native Standalone Link */}
              <a
                href={standaloneUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{isArabic ? 'فتح البوابة في نافذة جديدة' : 'Open in Standalone Window'}</span>
              </a>

              {/* Alternatives */}
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                {onSwitchToManual && (
                  <button
                    type="button"
                    onClick={onSwitchToManual}
                    className="w-full py-1.5 px-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 text-[10px] font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Key className="w-3 h-3 text-amber-400" />
                    <span>{isArabic ? 'كود يدوي' : 'Manual'}</span>
                  </button>
                )}

                {onSwitchToUpload && (
                  <button
                    type="button"
                    onClick={onSwitchToUpload}
                    className="w-full py-1.5 px-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 text-[10px] font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Upload className="w-3 h-3 text-amber-400" />
                    <span>{isArabic ? 'رفع صورة' : 'Upload'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {errorMsg && hasPermission !== false && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-950 p-4 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-500 animate-pulse" />
            <p className="text-[11px] text-neutral-300 font-sans leading-relaxed max-w-[250px]">
              {errorMsg}
            </p>

            <div className="flex flex-col gap-1.5 w-full max-w-[240px] pt-1">
              <a
                href={standaloneUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{isArabic ? 'فتح في نافذة جديدة' : 'Open in New Window'}</span>
              </a>

              {onSwitchToManual && (
                <button
                  type="button"
                  onClick={onSwitchToManual}
                  className="w-full py-1.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isArabic ? 'إدخال الكود يدوياً' : 'Enter Code Manually'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* The robust scanner component */}
        {hasPermission !== false && !errorMsg && (
          <div className="w-full h-full relative z-0">
            <Scanner
              onScan={handleScan}
              onError={handleError}
              formats={['qr_code']}
              styles={{
                container: { width: '100%', height: '100%' },
                video: { objectFit: 'cover' }
              }}
            />
            
            {/* Custom Overlay below scanner */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/75 backdrop-blur-md border border-neutral-800 py-2 px-3 rounded-xl text-center pointer-events-none z-10">
              <span className="text-[10px] text-amber-400 font-bold block animate-pulse">
                {isArabic ? '💡 وجّه الكاميرا نحو باركود التذكرة' : '💡 Point camera at ticket QR code'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

