import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, MessageSquare, Send, CheckCircle2, ShieldCheck, Sparkles, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const { lang, user, sendSupportMessage } = useApp();
  const [messageText, setMessageText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRefNumber, setSubmittedRefNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setMessageText('');
    setSubmittedRefNumber(null);
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) {
      setError(lang === 'ar' ? 'يرجى كتابة نص الرسالة أولاً' : 'Please enter a message first');
      return;
    }
    if (messageText.length > 500) {
      setError(lang === 'ar' ? 'النص يتجاوز الحد الأقصى (500 حرف)' : 'Message exceeds 500 characters limit');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await sendSupportMessage(messageText.trim());
      setSubmittedRefNumber(res.refNumber);
    } catch (err: any) {
      setError(err?.message || (lang === 'ar' ? 'حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة لاحقاً.' : 'Error sending message. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl text-neutral-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950/80 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">
                  {lang === 'ar' ? 'مراسلة إدارة التطبيق' : 'App Support & Feedback'}
                </h3>
                <p className="text-xs text-neutral-400 font-mono">
                  {lang === 'ar' ? 'صندوق المقترحات والشكاوى المباشر' : 'Direct Suggestions & Complaints Inbox'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {submittedRefNumber ? (
              /* Success State */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-4"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mx-auto border border-emerald-500/30 shadow-lg gold-glow">
                  <CheckCircle2 className="h-10 w-10" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-white">
                    {lang === 'ar' ? 'تم إرسال رسالتك بنجاح!' : 'Message Sent Successfully!'}
                  </h4>
                  <div className="inline-block px-4 py-2 rounded-2xl bg-black/60 border border-amber-500/30 font-mono text-amber-400 text-sm font-bold shadow-inner">
                    {submittedRefNumber}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-md mx-auto bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800">
                  {lang === 'ar'
                    ? `تم توجيه رسالتك بالرقم المرجعي (${submittedRefNumber}) واسم المستخدم (${user?.name || ''}) إلى صندوق الرسائل في لوحة تحكم الإدارة. سوف نقوم بالرد عليك في أقرب وقت وسيصلك إشعار الرد في ملفك الشخصي.`
                    : `Your message with reference (${submittedRefNumber}) and username (${user?.name || ''}) has been directed to the admin messages inbox. We will respond soon, and you will receive a notification in your profile.`}
                </p>

                <button
                  onClick={handleClose}
                  className="w-full sm:w-auto min-w-[200px] rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3.5 text-sm font-bold text-black shadow-lg hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer"
                >
                  {lang === 'ar' ? 'حسناً، إغلاق' : 'OK, Close'}
                </button>
              </motion.div>
            ) : (
              /* Input Form State */
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Welcoming Greeting Box */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-neutral-900/90 to-neutral-950 p-5 border border-amber-500/30 shadow-inner">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-start gap-3 relative z-10">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-medium">
                      {lang === 'ar' ? (
                        <>
                          <span className="font-bold text-amber-400">مرحباً ({user?.name || 'صديقنا العزيز'})</span>، نرحب بجميع اقتراحاتكم وشكاوى من أجل تحسين خدمة التطبيق، وسوف نقوم بالرد عليه في أقرب وقت، وسوف يصلكم إشعار الرد على حسابكم الخاص بالرقم المرجعي لهذه الرسالة.
                        </>
                      ) : (
                        <>
                          <span className="font-bold text-amber-400">Hello ({user?.name || 'Valued Member'})</span>, we welcome all your suggestions and feedback to improve our service. We will respond as soon as possible, and you will receive a notification with the reference number in your profile.
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Textarea Field */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-neutral-400 px-1">
                    <span>{lang === 'ar' ? 'نص الرسالة أو الاقتراح:' : 'Message or Suggestion:'}</span>
                    <span className={`font-mono font-bold ${messageText.length > 450 ? 'text-amber-400' : 'text-neutral-500'}`}>
                      {messageText.length} / 500
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    maxLength={500}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={
                      lang === 'ar'
                        ? 'اكتب هنا فيما لا يزيد عن خمسمائة حرف...'
                        : 'Write your message here (max 500 characters)...'
                    }
                    className="w-full rounded-2xl bg-neutral-950 p-4 text-sm text-white placeholder-neutral-500 border border-neutral-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all resize-none leading-relaxed"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold text-center">
                    {error}
                  </div>
                )}

                {/* Submit Action Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full sm:w-auto rounded-xl px-5 py-3 text-xs font-bold text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
                  >
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !messageText.trim()}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-xs font-bold text-black shadow-lg hover:from-amber-400 hover:to-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    <span>
                      {isSubmitting
                        ? (lang === 'ar' ? 'جاري الإرسال...' : 'Sending...')
                        : (lang === 'ar' ? 'إرسال الرسالة' : 'Send Message')}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
