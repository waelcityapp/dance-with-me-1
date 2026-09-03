import React from 'react';
import { useApp } from '../../context/AppContext';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Calendar, 
  MapPin, 
  Music, 
  GraduationCap, 
  Plane, 
  Ticket, 
  QrCode, 
  ShieldCheck,
  Building2,
  Briefcase,
  Wrench
} from 'lucide-react';

export const AboutUsPage: React.FC = () => {
  const { lang, appAssets, setActiveTab } = useApp();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Header Back & Title */}
      <div className="flex items-center gap-4 bg-white dark:bg-neutral-900 p-4 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setActiveTab('explore')}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
        >
          {lang === 'ar' ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
        </button>
        <div>
          <h1 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white">
            {lang === 'ar' ? 'عن التطبيق' : 'About App'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-medium">
            {lang === 'ar' ? 'تعرف على فكرة وأهمية سيتي إيف' : 'Discover the idea and importance of CityEve'}
          </p>
        </div>
      </div>

      {/* Hero Banner Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#6B0D18] to-[#3D0309] shadow-xl border border-[#78101F]">
        <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/dynasmcaj/image/upload/v1710156906/pattern-bg.png')] opacity-10 mix-blend-overlay" />
        <div className="relative p-6 sm:p-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-[#42030A] rounded-3xl p-1.5 shadow-2xl border-4 border-white/10 mb-6">
            <img 
              src={appAssets?.app_icon_url || "https://res.cloudinary.com/dynasmcaj/image/upload/fbyjfjq8equle5pl7kwz.png"} 
              alt="Logo" 
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight">
            {appAssets?.appNameEn || appAssets?.appNameAr || "CityEve"}
          </h2>
          <p className="text-amber-500 text-sm sm:text-base font-bold max-w-xl leading-relaxed">
            {lang === 'ar' 
              ? 'المنصة الأولى الشاملة للحفلات، المعارض، الفعاليات، الكورسات، والرحلات في مصر.'
              : 'The first comprehensive platform for parties, exhibitions, events, courses, and trips in Egypt.'}
          </p>
        </div>
      </div>

      {/* Concept and Importance */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-neutral-200 dark:border-neutral-800 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 end-0 p-8 opacity-5">
          <Sparkles className="w-40 h-40" />
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
            <Sparkles className="w-6 h-6" />
          </div>
          {lang === 'ar' ? 'فكرة التطبيق وأهميته' : 'App Concept & Importance'}
        </h3>
        <div className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 font-medium leading-loose space-y-4 relative z-10">
          <p>
            {lang === 'ar' 
              ? 'صُمم تطبيق CityEve ليكون الدليل الشامل والموثوق الذي يجمع بين الباحثين عن الترفيه والتعلم وبين منظمي الفعاليات ومقدمي الخدمات في مكان واحد متكامل.' 
              : 'CityEve was designed to be the comprehensive and reliable guide that brings together entertainment and learning seekers with event organizers and service providers in one integrated place.'}
          </p>
          <p>
            {lang === 'ar' 
              ? 'تكمن أهمية التطبيق في توفير الجهد والوقت من خلال تحويل عملية البحث التقليدية والحجز إلى تجربة رقمية سهلة وآمنة، مما يعزز من حضور الفعاليات الثقافية والفنية في مصر، ويوفر للمنظمين أداة قوية لإدارة الحجوزات والوصول إلى شريحة أكبر من المهتمين.'
              : 'The application’s importance lies in saving time and effort by transforming the traditional search and booking process into an easy and secure digital experience. This boosts attendance at cultural and artistic events in Egypt and provides organizers with a powerful tool to manage bookings and reach a wider interested audience.'}
          </p>
        </div>
      </div>

      {/* Main Categories */}
      <div className="space-y-4">
        <h3 className="text-xl font-black text-neutral-900 dark:text-white px-2">
          {lang === 'ar' ? 'الأقسام الرئيسية والفرعية' : 'Main & Sub Categories'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 shadow-sm border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500">
                <Music className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-neutral-900 dark:text-white text-lg">
                {lang === 'ar' ? 'الحفلات والسهرات' : 'Parties & Nightlife'}
              </h4>
            </div>
            <ul className="text-sm text-neutral-600 dark:text-neutral-400 font-medium space-y-2 list-disc list-inside">
              <li>{lang === 'ar' ? 'حفلات لاتيني (سالسا، باتشاتا، كيزومبا)' : 'Latin Parties (Salsa, Bachata, Kizomba)'}</li>
              <li>{lang === 'ar' ? 'حفلات عربي وشرقي' : 'Arabic & Oriental Parties'}</li>
              <li>{lang === 'ar' ? 'سهرات ليلية عامة' : 'General Nightlife'}</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 shadow-sm border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-neutral-900 dark:text-white text-lg">
                {lang === 'ar' ? 'الكورسات وورش العمل' : 'Courses & Workshops'}
              </h4>
            </div>
            <ul className="text-sm text-neutral-600 dark:text-neutral-400 font-medium space-y-2 list-disc list-inside">
              <li>{lang === 'ar' ? 'كورسات تعليم الرقص بجميع أنواعه' : 'Dance learning courses of all types'}</li>
              <li>{lang === 'ar' ? 'ورش عمل فنية وثقافية' : 'Artistic & Cultural workshops'}</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 shadow-sm border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                <Plane className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-neutral-900 dark:text-white text-lg">
                {lang === 'ar' ? 'الرحلات والمهرجانات' : 'Trips & Festivals'}
              </h4>
            </div>
            <ul className="text-sm text-neutral-600 dark:text-neutral-400 font-medium space-y-2 list-disc list-inside">
              <li>{lang === 'ar' ? 'رحلات الرقص والسفر' : 'Dance Trips & Travel'}</li>
              <li>{lang === 'ar' ? 'مهرجانات دولية ومحلية' : 'Local & International Festivals'}</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 shadow-sm border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
                <Building2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-neutral-900 dark:text-white text-lg">
                {lang === 'ar' ? 'المعارض والمؤتمرات' : 'Exhibitions & Conferences'}
              </h4>
            </div>
            <ul className="text-sm text-neutral-600 dark:text-neutral-400 font-medium space-y-2 list-disc list-inside">
              <li>{lang === 'ar' ? 'معارض تجارية وفنية' : 'Commercial & Art Exhibitions'}</li>
              <li>{lang === 'ar' ? 'مؤتمرات أعمال متخصصة' : 'Specialized Business Conferences'}</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 shadow-sm border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                <Wrench className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-neutral-900 dark:text-white text-lg">
                {lang === 'ar' ? 'الخدمات' : 'Services'}
              </h4>
            </div>
            <ul className="text-sm text-neutral-600 dark:text-neutral-400 font-medium space-y-2 list-disc list-inside">
              <li>{lang === 'ar' ? 'تأجير قاعات ومعدات' : 'Halls & Equipment Rentals'}</li>
              <li>{lang === 'ar' ? 'خدمات التصوير والتنظيم' : 'Photography & Organizing'}</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 shadow-sm border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-500">
                <Briefcase className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-neutral-900 dark:text-white text-lg">
                {lang === 'ar' ? 'الوظائف' : 'Jobs'}
              </h4>
            </div>
            <ul className="text-sm text-neutral-600 dark:text-neutral-400 font-medium space-y-2 list-disc list-inside">
              <li>{lang === 'ar' ? 'فرص عمل في مجال الفعاليات' : 'Job opportunities in Events'}</li>
              <li>{lang === 'ar' ? 'مطلوب مدربين وفنانين' : 'Instructors & Artists wanted'}</li>
            </ul>
          </div>

        </div>
      </div>

      {/* Key Services Offered */}
      <div className="space-y-4 pt-4">
        <h3 className="text-xl font-black text-neutral-900 dark:text-white px-2">
          {lang === 'ar' ? 'أهم الخدمات التقنية التي يقدمها التطبيق' : 'Key Technical Services Offered'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="flex gap-4 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="shrink-0 mt-1">
              <div className="p-3 rounded-full bg-[#78101F]/10 text-[#78101F] dark:text-red-400">
                <Ticket className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h4 className="font-bold text-neutral-900 dark:text-white mb-2 text-lg">
                {lang === 'ar' ? 'حجز التذاكر الإلكتروني' : 'Digital Ticket Booking'}
              </h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed">
                {lang === 'ar' 
                  ? 'يمكن للمستخدمين حجز التذاكر بكل سهولة لأي فعالية، وإرفاق إيصالات الدفع مباشرة عبر التطبيق للمراجعة والموافقة الفورية.' 
                  : 'Users can easily book tickets for any event, and attach payment receipts directly via the app for instant review and approval.'}
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="shrink-0 mt-1">
              <div className="p-3 rounded-full bg-[#78101F]/10 text-[#78101F] dark:text-red-400">
                <QrCode className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h4 className="font-bold text-neutral-900 dark:text-white mb-2 text-lg">
                {lang === 'ar' ? 'تحقق ذكي بالتذاكر (QR)' : 'Smart Ticket Verification (QR)'}
              </h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed">
                {lang === 'ar' 
                  ? 'نظام متكامل للمنظمين يحتوي على ماسح ضوئي لرموز الاستجابة السريعة (QR Scanner) للتحقق من التذاكر على البوابات وتسجيل الحضور آلياً.' 
                  : 'An integrated system for organizers featuring a QR Scanner to verify tickets at the gates and log attendance automatically.'}
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="shrink-0 mt-1">
              <div className="p-3 rounded-full bg-[#78101F]/10 text-[#78101F] dark:text-red-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h4 className="font-bold text-neutral-900 dark:text-white mb-2 text-lg">
                {lang === 'ar' ? 'نظام إدارة المنظمين والصلاحيات' : 'Organizers & Roles Management'}
              </h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed">
                {lang === 'ar' 
                  ? 'يسمح التطبيق للمنظمين بإضافة أفراد فريق الأمن (Staff) بأرقام سرية مخصصة لإدارة بوابات محددة دون الوصول لمعلومات حساسة.' 
                  : 'The app allows organizers to add security staff with custom PINs to manage specific gates without accessing sensitive data.'}
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="shrink-0 mt-1">
              <div className="p-3 rounded-full bg-[#78101F]/10 text-[#78101F] dark:text-red-400">
                <MapPin className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h4 className="font-bold text-neutral-900 dark:text-white mb-2 text-lg">
                {lang === 'ar' ? 'اكتشاف الأماكن والوصول السريع' : 'Places Discovery & Quick Access'}
              </h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed">
                {lang === 'ar' 
                  ? 'الربط المباشر مع خرائط جوجل لسهولة الوصول لمواقع الفعاليات، بالإضافة لعرض تفاصيل التواصل مع المنظمين ومشاركة الفعالية بنقرة.' 
                  : 'Direct integration with Google Maps for easy access to event locations, plus showing organizer contact details and 1-click sharing.'}
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
