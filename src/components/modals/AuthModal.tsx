import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, User, Mail, Sparkles, Check, ShieldCheck, LogOut, Lock, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DanceStyle, ALL_DANCE_STYLES, getStyleLabel } from '../../types';
import { loginWithFirebaseGoogle, registerWithFirebaseEmail, loginWithFirebaseEmail, getUserByEmailFromFirestore } from '../../lib/firebase';

const GoogleLogo = ({ className = "h-4 w-4 shrink-0" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getAuthErrorMessage = (code: string, lang: 'ar' | 'en'): string => {
  if (lang === 'ar') {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'البريد الإلكتروني أو كلمة المرور غير صحيحة. تنبيه هام: إذا قمت بالتسجيل سابقاً بكلمة مرور سهلة (أقل من 6 أحرف)، فإن النظام القديم لم يقم بإنشاء حسابك الفعلي على خادم الحماية. يرجى اختيار تبويب "إنشاء حساب" بالأعلى وإنشاء حساب جديد بنفس البريد بكلمة مرور قوية (6 أحرف أو أكثر)، وسيتم ربط حسابك بكافة إعلاناتك وبياناتك السابقة فوراً وبشكل آمن!';
      case 'auth/email-already-in-use':
        return 'هذا البريد الإلكتروني مسجل بالفعل لدينا. يرجى اختيار تبويب "تسجيل الدخول" وإدخال كلمة المرور الصحيحة. إذا نسيت كلمة المرور، يمكنك إنشاء حساب ببريد إلكتروني مختلف أو استخدام تسجيل الدخول المباشر بحساب جوجل.';
      case 'auth/weak-password':
        return 'كلمة المرور ضعيفة للغاية! لحماية حسابك، يجب ألا تقل كلمة المرور عن 6 أحرف.';
      case 'auth/invalid-email':
        return 'البريد الإلكتروني غير صحيح. يرجى كتابته بشكل سليم (مثال: name@example.com).';
      case 'auth/operation-not-allowed':
        return 'طريقة تسجيل الدخول بالبريد الإلكتروني وكلمة المرور غير مفعّلة في مشروع Firebase الخاص بك. يرجى تفعيلها من لوحة تحكم Firebase Console في قسم Authentication.';
      case 'auth/network-request-failed':
        return 'فشل الاتصال بالشبكة. يرجى التحقق من جودة اتصال الإنترنت الخاص بك ثم المحاولة مجدداً.';
      default:
        return 'فشل التحقق من البيانات والمصادقة. يرجى التأكد من كتابة البريد وكلمة المرور (6 أحرف فأكثر) بشكل صحيح والمحاولة مرة أخرى.';
    }
  } else {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Incorrect email or password. Note: If you registered previously with a weak password (less than 6 characters), your actual secure account was not created. Please switch to "Create Account" tab above and register a new account using the same email and a password of 6+ characters. All your previous data will be securely synced!';
      case 'auth/email-already-in-use':
        return 'This email address is already registered. Please use the "Sign In" tab. If you forgot your password, please register with a new email or use Sign In with Google.';
      case 'auth/weak-password':
        return 'Password is too weak. For your security, it must be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Invalid email address format. Please enter a valid email (e.g., name@example.com).';
      case 'auth/operation-not-allowed':
        return 'Email/Password sign-in provider is not enabled in your Firebase project. Please enable it in the Firebase Console (Authentication -> Sign-in method -> Email/Password).';
      case 'auth/network-request-failed':
        return 'Network request failed. Please check your internet connection and try again.';
      default:
        return 'Authentication failed. Please verify your credentials and try again.';
    }
  }
};

import { GENDER_NEUTRAL_AVATARS, DEFAULT_NEUTRAL_AVATAR } from '../../utils/avatars';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { lang, user, loginUser, logoutUser, updateUserFavorites } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<DanceStyle[]>(['Salsa', 'Bachata']);
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_NEUTRAL_AVATAR);
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'google_consent' | 'google_onboarding'>('register');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authErrorCode, setAuthErrorCode] = useState<string | null>(null);

  React.useEffect(() => {
    setErrorMsg(null);
    setAuthErrorCode(null);
  }, [activeTab]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (result) {
          setSelectedAvatar(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAuth(true);
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      if (activeTab === 'register') {
        if (!name.trim()) {
          setErrorMsg(lang === 'ar' ? 'الرجاء إدخال الاسم بالكامل' : 'Please enter your full name');
          setLoadingAuth(false);
          return;
        }
        if (!password || password.length < 6) {
          setErrorMsg(lang === 'ar' ? 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل' : 'Password must be at least 6 characters long');
          setLoadingAuth(false);
          return;
        }

        let firebaseUser: any = null;
        let isFallback = false;

        try {
          firebaseUser = await registerWithFirebaseEmail(cleanEmail, password);
        } catch (authErr: any) {
          if (authErr.code === 'auth/operation-not-allowed') {
            console.warn('Firebase Email/Password provider disabled. Falling back to secure Firestore database registration.');
            isFallback = true;
          } else {
            throw authErr;
          }
        }

        if (isFallback) {
          const existing = await getUserByEmailFromFirestore(cleanEmail);
          if (existing) {
            const err = new Error('Email already registered');
            (err as any).code = 'auth/email-already-in-use';
            throw err;
          }
          const customUid = `user-${Date.now()}`;
          const userName = name.trim();
          await loginUser(userName, cleanEmail, selectedAvatar, customUid, password);
        } else {
          if (!firebaseUser) {
            throw new Error('Registration failed');
          }
          const userName = name.trim();
          await loginUser(userName, cleanEmail, selectedAvatar, firebaseUser.uid, password);
        }
      } else {
        if (!password || password.length < 6) {
          setErrorMsg(lang === 'ar' ? 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل' : 'Password must be at least 6 characters long');
          setLoadingAuth(false);
          return;
        }

        let firebaseUser: any = null;
        let isFallback = false;

        try {
          firebaseUser = await loginWithFirebaseEmail(cleanEmail, password);
        } catch (authErr: any) {
          if (authErr.code === 'auth/operation-not-allowed') {
            console.warn('Firebase Email/Password provider disabled. Falling back to secure Firestore database login.');
            isFallback = true;
          } else {
            throw authErr;
          }
        }

        if (isFallback) {
          const existing = await getUserByEmailFromFirestore(cleanEmail);
          if (!existing) {
            const err = new Error('User not found');
            (err as any).code = 'auth/user-not-found';
            throw err;
          }
          if (existing.password && existing.password !== password) {
            const err = new Error('Wrong password');
            (err as any).code = 'auth/wrong-password';
            throw err;
          }
          const userAvatar = existing.avatar || selectedAvatar;
          const userName = existing.name || name.trim() || (lang === 'ar' ? 'عضو النادي (VIP)' : 'VIP Club Member');
          await loginUser(userName, cleanEmail, userAvatar, existing.id, password);
        } else {
          if (!firebaseUser) {
            throw new Error('Login failed');
          }

          const existing = await getUserByEmailFromFirestore(cleanEmail);
          const userName = existing?.name || name.trim() || (lang === 'ar' ? 'عضو النادي (VIP)' : 'VIP Club Member');
          const userAvatar = existing?.avatar || selectedAvatar;
          await loginUser(userName, cleanEmail, userAvatar, firebaseUser.uid, password);
        }
      }
      updateUserFavorites(selectedStyles);
      onClose();
    } catch (err: any) {
      console.error('Auth error:', err);
      const errorCode = err.code || 'unknown';
      setAuthErrorCode(errorCode);
      setErrorMsg(getAuthErrorMessage(errorCode, lang));
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleGoogleLogin = () => {
    setActiveTab('google_consent');
  };

  const confirmGoogleAuth = async () => {
    setLoadingAuth(true);
    try {
      const googleUser = await loginWithFirebaseGoogle();
      if (googleUser && googleUser.email) {
        const existing = await getUserByEmailFromFirestore(googleUser.email);
        if (existing) {
          loginUser(existing.name || googleUser.name, existing.email, existing.avatar || googleUser.avatar);
          onClose();
          return;
        }
        setName(googleUser.name || (lang === 'ar' ? 'عضو النادي (Google)' : 'Google Member'));
        setEmail(googleUser.email);
        if (googleUser.avatar) setSelectedAvatar(googleUser.avatar);
      } else {
        setName(lang === 'ar' ? 'عضو النادي (Google)' : 'Google Member');
        setEmail('member@dwm.app');
      }
      setActiveTab('google_onboarding');
    } catch (err) {
      console.error('Google login error:', err);
      setName(lang === 'ar' ? 'عضو النادي (Google)' : 'Google Member');
      setEmail('member@dwm.app');
      setActiveTab('google_onboarding');
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleCompleteGoogleOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStyles.length === 0) {
      alert(lang === 'ar' ? 'برجاء اختيار نمط رقص واحد على الأقل للمتابعة' : 'Please select at least one dance style to continue');
      return;
    }
    const finalName = name.trim() || (lang === 'ar' ? 'عضو VIP (Google)' : 'Google VIP Member');
    const finalEmail = email.trim() || 'member@dwm.app';
    loginUser(finalName, finalEmail, selectedAvatar);
    updateUserFavorites(selectedStyles);
    onClose();
  };

  const toggleStyle = (style: DanceStyle) => {
    if (selectedStyles.includes(style)) {
      setSelectedStyles(selectedStyles.filter(s => s !== style));
    } else {
      setSelectedStyles([...selectedStyles, style]);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 shadow-2xl gold-glow"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-neutral-950 p-5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                {user ? <ShieldCheck className="h-5 w-5" /> : activeTab === 'google_consent' ? <GoogleLogo className="h-5 w-5" /> : activeTab === 'google_onboarding' ? <Sparkles className="h-5 w-5 text-amber-400" /> : <User className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="font-bold text-white text-base">
                  {user
                    ? (lang === 'ar' ? 'حساب المستخدم الفاخر (VIP)' : 'VIP Member Profile')
                    : activeTab === 'google_consent'
                      ? (lang === 'ar' ? 'الموافقة على صلاحيات Google' : 'Google Account Consent')
                      : activeTab === 'google_onboarding'
                        ? (lang === 'ar' ? 'تخصيص الملف الشخصي والأنماط' : 'VIP Profile & Styles Setup')
                        : (lang === 'ar' 
                            ? (activeTab === 'register' ? 'إنشاء حساب جديد' : 'تسجيل الدخول') 
                            : (activeTab === 'register' ? 'Create New Account' : 'Sign In'))}
                </h3>
                <p className="text-xs text-neutral-400 font-mono">
                  {user ? user.email : (lang === 'ar' ? 'انضم إلى مجتمع النادي وأدر حجوزاتك وحفلاتك' : 'Join the club community to manage bookings and events')}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* If already logged in */}
          {user ? (
            <div className="p-6 space-y-6 text-center overflow-y-auto flex-1">
              <div className="flex flex-col items-center gap-3">
                <img src={user.avatar} alt={user.name} className="h-20 w-20 rounded-2xl object-cover border-2 border-amber-500 shadow-xl gold-glow" />
                <div>
                  <h4 className="text-lg font-bold text-white">{user.name}</h4>
                  <p className="text-xs font-mono text-amber-400 mt-0.5">VIP Club Member | عضوية النادي الفاخرة</p>
                </div>
              </div>

              <div className="rounded-2xl bg-neutral-950/80 p-4 border border-white/5 text-left space-y-2">
                <p className="text-xs font-mono text-neutral-400">{lang === 'ar' ? 'أنماط الرقص المفضلة:' : 'Favorite Dance Styles:'}</p>
                <div className="flex flex-wrap gap-1.5">
                  {user.favoriteStyles.map(s => (
                    <span key={s} className="rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300 border border-amber-500/20 font-mono">
                      #{s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl bg-neutral-800 py-3 text-sm font-semibold text-white hover:bg-neutral-700 transition-colors"
                >
                  {lang === 'ar' ? 'إغلاق' : 'Close'}
                </button>
                <button
                  onClick={() => { logoutUser(); onClose(); }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-600/20 py-3 px-5 text-sm font-bold text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
                </button>
              </div>
            </div>
          ) : activeTab === 'google_consent' ? (
            /* Clean Google OAuth Consent Box */
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Google Brand Header */}
              <div className="flex flex-col items-center justify-center text-center pb-3 border-b border-white/10">
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-3 border border-white/20 shadow-md">
                  <GoogleLogo className="h-5 w-5" />
                  <span className="font-extrabold text-white text-base tracking-wide">Google Account</span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  {lang === 'ar' ? 'تسجيل الدخول باستخدام حساب Google' : 'Sign in with Google'}
                </h3>
                <p className="text-xs text-neutral-400 font-mono mt-1">
                  {lang === 'ar' ? 'المتابعة بأمان إلى تطبيق Dance With Me' : 'Continue securely to Dance With Me'}
                </p>
              </div>

              {/* The exact requested Permission Consent Box */}
              <div className="rounded-2xl bg-neutral-950 p-4 border border-blue-500/30 shadow-lg space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs sm:text-sm">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>
                    {lang === 'ar' 
                      ? 'ستسمح Google لتطبيق Dance With Me بالوصول إلى:' 
                      : 'Google will allow Dance With Me to access:'}
                  </span>
                </div>

                <div className="space-y-2.5 pt-1 pl-1 pr-1">
                  <div className="flex items-start gap-2.5 text-xs text-neutral-200">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      {lang === 'ar'
                        ? 'اسمك الكامل وصورتك الشخصية (الملف التعريفي العام)'
                        : 'Your full name and profile picture (public profile)'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-200">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      {lang === 'ar'
                        ? 'عنوان بريدك الإلكتروني الأساسي المرتبط بحساب Google'
                        : 'Your primary email address associated with your Google account'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-neutral-200">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      {lang === 'ar'
                        ? 'ربط حسابك بمجتمع النادي الفاخر وإدارة الحجوزات والفعاليات بأمان'
                        : 'Securely connect to the VIP club community and manage your bookings'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 text-[11px] text-neutral-500 font-mono">
                  {lang === 'ar'
                    ? '🔒 لا يمكن لتطبيق Dance With Me الوصول إلى كلمات مرورك أو أي ملفات خاصة. حماية بياناتك وموافقاتك مضمونة من Google.'
                    : '🔒 Dance With Me cannot access passwords or private data. Your privacy and consent are protected by Google.'}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={confirmGoogleAuth}
                  disabled={loadingAuth}
                  className="w-full sm:flex-[2.5] rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 py-3 px-4 text-xs sm:text-sm font-extrabold text-white hover:from-blue-500 hover:to-indigo-500 shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-blue-400/30 active:scale-[0.99]"
                >
                  <GoogleLogo className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">
                    {lang === 'ar' 
                      ? 'الموافقة والمتابعة ✓' 
                      : 'Allow & Continue ✓'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="w-full sm:flex-1 rounded-xl bg-neutral-800 py-3 px-4 text-xs font-bold text-neutral-300 hover:bg-neutral-700 hover:text-white transition-all cursor-pointer text-center"
                >
                  {lang === 'ar' ? 'إلغاء والرجوع' : 'Cancel & Back'}
                </button>
              </div>
            </div>
          ) : activeTab === 'google_onboarding' ? (
            /* Mandatory Profile Completion Step After Google Auth */
            <form onSubmit={handleCompleteGoogleOnboarding} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="rounded-2xl bg-amber-500/10 p-4 border border-amber-500/30 text-left">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm mb-1">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>{lang === 'ar' ? 'خطوة أخيرة: استكمال ملفك الشخصي' : 'Final Step: Complete Your VIP Profile'}</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {lang === 'ar'
                    ? 'تم التحقق من حسابك في Google بنجاح! لضمان تخصيص التوصيات وإشعارات الحفلات والفعاليات المناسبة لذوقك، يرجى مراجعة اسمك واختيار صورتك وأنماط الرقص المفضلة لديك:'
                    : 'Your Google account is verified! To receive custom event recommendations, please confirm your display name, avatar, and favorite dance styles:'}
                </p>
              </div>

              {/* Name field */}
              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1.5 font-bold">
                  {lang === 'ar' ? 'الاسم الذي تفضل الظهور به في الفعاليات والحفلات:' : 'Display Name for Events & Parties:'}
                </label>
                <div className="relative">
                  <User className="absolute top-3 left-3 h-4 w-4 text-amber-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: سارة علي' : 'e.g. Sarah Ali'}
                    className="w-full rounded-xl border border-amber-500/40 bg-neutral-950 py-2.5 pl-10 pr-4 text-sm text-white font-bold placeholder-neutral-600 outline-none focus:border-amber-400 transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Avatar section */}
              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-2 font-bold">
                  {lang === 'ar' ? 'الصورة الشخصية (اختر أيقونة فاخرة أو ارفع صورتك):' : 'Profile Avatar (Select or Upload Custom Photo):'}
                </label>
                <div className="flex items-center justify-start gap-3 py-1 overflow-x-auto pb-2">
                  {GENDER_NEUTRAL_AVATARS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedAvatar(av)}
                      className={`relative h-12 w-12 shrink-0 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedAvatar === av ? 'border-amber-400 scale-110 shadow-lg gold-glow' : 'border-white/10 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={av} alt="Avatar option" className="h-full w-full object-cover" />
                      {selectedAvatar === av && (
                        <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white drop-shadow" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-2 flex items-center justify-between bg-neutral-950 p-2.5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2">
                    <img src={selectedAvatar} alt="Current avatar" className="h-9 w-9 rounded-xl object-cover border border-amber-400" />
                    <span className="text-xs text-neutral-300 font-mono">
                      {lang === 'ar' ? 'ارفع صورة مخصصة من جهازك:' : 'Upload custom photo:'}
                    </span>
                  </div>
                  <label className="cursor-pointer rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/20 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition-all flex items-center gap-1.5">
                    <Upload className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'رفع صورة 📁' : 'Upload 📁'}</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Favorite Styles section */}
              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-2 font-bold flex items-center justify-between">
                  <span>{lang === 'ar' ? 'أنماط الرقص المفضلة (اختر نمطاً أو أكثر):' : 'Favorite Dance Styles (Select one or more):'}</span>
                  <span className="text-[10px] text-amber-400 font-normal">{lang === 'ar' ? 'مطلوب نمط واحد على الأقل *' : 'At least 1 required *'}</span>
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {ALL_DANCE_STYLES.map(s => {
                    const isSelected = selectedStyles.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleStyle(s)}
                        className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-neutral-950 shadow-md scale-105 border border-amber-400'
                            : 'bg-neutral-950 text-neutral-400 border border-white/10 hover:border-white/30'
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                        <span>{getStyleLabel(s, lang)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 py-3.5 px-4 text-sm font-extrabold text-neutral-950 shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer gold-glow"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{lang === 'ar' ? 'حفظ واعتتماد الملف الشخصي والدخول للمنصة ✓' : 'Save Profile & Enter Platform ✓'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Register / Login Form */
            <form onSubmit={handleAuth} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Top Google Sign-In Button */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loadingAuth}
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-white text-neutral-800 py-2.5 px-4 text-xs font-semibold shadow-sm hover:bg-neutral-50 hover:shadow transition-all border border-neutral-200 cursor-pointer active:scale-[0.99]"
                >
                  <GoogleLogo className="h-4 w-4" />
                  <span>
                    {lang === 'ar' 
                      ? 'المتابعة باستخدام حساب جوجل (Google)' 
                      : 'Continue with Google Account'}
                  </span>
                </button>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10"></div>
                  <span className="text-[11px] font-mono font-bold text-neutral-400">
                    {lang === 'ar' ? 'أو باستخدام البريد الإلكتروني' : 'OR WITH EMAIL & PASSWORD'}
                  </span>
                  <div className="h-px flex-1 bg-white/10"></div>
                </div>
              </div>

              <div className="flex rounded-xl bg-neutral-950 p-1 border border-white/10 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'register' ? 'bg-amber-500 text-neutral-950 shadow-md' : 'text-neutral-400 hover:text-white'}`}
                >
                  {lang === 'ar' ? 'إنشاء حساب' : 'Create Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'login' ? 'bg-amber-500 text-neutral-950 shadow-md' : 'text-neutral-400 hover:text-white'}`}
                >
                  {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
                </button>
              </div>

              {errorMsg && (
                <div className="p-3.5 text-xs rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <span className="text-sm shrink-0">⚠️</span>
                    <span className="leading-relaxed">{errorMsg}</span>
                  </div>
                  {authErrorCode === 'auth/email-already-in-use' && activeTab === 'register' && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('login');
                        setErrorMsg(null);
                        setAuthErrorCode(null);
                      }}
                      className="mt-1 text-left self-start text-xs text-amber-400 hover:text-amber-300 underline font-extrabold cursor-pointer transition-all active:scale-[0.98]"
                    >
                      {lang === 'ar' ? '← اضغط هنا للذهاب إلى "تسجيل الدخول" مباشرةً مع الاحتفاظ ببريدك' : '← Click here to go to "Sign In" directly with your email kept'}
                    </button>
                  )}
                </div>
              )}

              {activeTab === 'register' && (
                <div>
                  <label className="block text-xs font-mono text-neutral-300 mb-1">
                    {lang === 'ar' ? 'الاسم بالكامل' : 'Full Name'}
                  </label>
                  <div className="relative">
                    <User className="absolute top-3 left-3 h-4 w-4 text-neutral-500" />
                    <input
                      type="text"
                      required={activeTab === 'register'}
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder={lang === 'ar' ? 'مثال: سارة علي' : 'e.g. Sarah Ali'}
                      className="w-full rounded-xl border border-white/10 bg-neutral-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-neutral-600 outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="absolute top-3 left-3 h-4 w-4 text-neutral-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full rounded-xl border border-white/10 bg-neutral-950 py-2.5 pl-10 pr-4 text-sm font-mono text-white placeholder-neutral-600 outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  {lang === 'ar' ? 'كلمة المرور' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute top-3 left-3 h-4 w-4 text-neutral-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/10 bg-neutral-950 py-2.5 pl-10 pr-4 text-sm font-mono text-white placeholder-neutral-600 outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {activeTab === 'register' && (
                <div>
                  <label className="block text-xs font-mono text-neutral-300 mb-2">
                    {lang === 'ar' ? 'اختر صورة الملف الشخصي أو قم بالرفع من جهازك:' : 'Select Profile Avatar or Upload Photo:'}
                  </label>
                  <div className="flex items-center justify-start gap-3 py-1">
                    {GENDER_NEUTRAL_AVATARS.map((av, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedAvatar(av)}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all p-0.5 cursor-pointer ${
                          selectedAvatar === av
                            ? 'border-amber-400 shadow-lg gold-glow scale-105 bg-amber-500/20'
                            : 'border-white/10 opacity-60 hover:opacity-100 bg-neutral-950'
                        }`}
                        title={`VIP Avatar ${idx + 1}`}
                      >
                        <img src={av} alt={`Avatar ${idx + 1}`} className="h-10 w-10 rounded-lg object-cover" />
                        {selectedAvatar === av && (
                          <div className="absolute top-1 right-1 bg-amber-400 rounded-full p-0.5 text-neutral-950">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Upload Photo From Device Section */}
                  <div className="mt-3 flex items-center justify-between bg-neutral-950 p-3 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-amber-400" />
                      <span className="text-xs text-neutral-300 font-mono">
                        {lang === 'ar' ? 'أو قم برفع صورة من جهازك 📁:' : 'Or upload photo from device 📁:'}
                      </span>
                    </div>
                    <label className="cursor-pointer rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/20 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition-all flex items-center gap-1.5">
                      <span>{lang === 'ar' ? 'اختر ملف الصورة' : 'Choose Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {!GENDER_NEUTRAL_AVATARS.includes(selectedAvatar) && (
                    <div className="mt-2 flex items-center gap-2 bg-amber-500/10 p-2 rounded-lg border border-amber-500/30">
                      <img src={selectedAvatar} alt="Uploaded preview" className="h-9 w-9 rounded-full object-cover border-2 border-amber-400 shadow" />
                      <span className="text-xs font-mono font-bold text-amber-300">
                        {lang === 'ar' ? '✓ تم اختيار الصورة وجاهزة للحفظ عند التسجيل' : '✓ Photo ready to save upon registration'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'register' && (
                <div>
                  <label className="block text-xs font-mono text-neutral-300 mb-2">
                    {lang === 'ar' ? 'أنماط الرقص المفضلة لديك:' : 'Your Favorite Dance Styles:'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_DANCE_STYLES.map(style => {
                      const isSelected = selectedStyles.includes(style);
                      return (
                        <button
                          key={style}
                          type="button"
                          onClick={() => toggleStyle(style)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-mono font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                              : 'bg-neutral-950 text-neutral-400 border-white/10 hover:border-white/30'
                          }`}
                        >
                          {isSelected && '✓ '}#{getStyleLabel(style, lang)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Prominent Save Data & Register / Login Button */}
              <button
                type="submit"
                disabled={loadingAuth}
                className="w-full mt-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 py-3.5 px-6 text-base font-extrabold text-neutral-950 hover:from-amber-400 hover:to-amber-500 shadow-xl gold-glow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="h-5 w-5 fill-current" />
                <span>
                  {lang === 'ar'
                    ? (activeTab === 'register' ? 'حفظ البيانات والتسجيل الآن 💾✨' : 'تسجيل الدخول الآن 🚀')
                    : (activeTab === 'register' ? 'Save Data & Register Now 💾✨' : 'Sign In Now 🚀')}
                </span>
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
