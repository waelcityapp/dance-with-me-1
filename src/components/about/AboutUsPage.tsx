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
  Wrench,
  Users,
  Mic,
  Camera,
  Layers,
  Award,
  Compass,
  CheckCircle2
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

      {/* 3 Core Pillars Section */}
      <div className="space-y-6 pt-2">
        <div className="px-2">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>{lang === 'ar' ? 'هيكلة المنصة والمنظومة' : 'Platform Ecosystem'}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
            {lang === 'ar' ? 'ركائز المنصة ومجالاتها الرئيسية' : 'Core Platform Pillars'}
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-medium mt-1">
            {lang === 'ar' 
              ? 'تغطي منصة CityEve منظومة متكاملة من 3 ركائز تجمع الجمهور، مقدمي الخدمات، وسوق العمل.' 
              : 'CityEve covers an integrated 3-pillar ecosystem connecting audiences, service providers, and talent.'}
          </p>
        </div>

        <div className="space-y-6">
          
          {/* Pillar 1: Core Events & Entertainment */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-neutral-200 dark:border-neutral-800 relative overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-[#78101F]/10 dark:bg-[#78101F]/20 text-[#78101F] dark:text-red-400 shrink-0">
                  <Calendar className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
                      {lang === 'ar' ? 'الركيزة الأولى' : 'Pillar 1'}
                    </span>
                    <span className="text-xs font-semibold text-neutral-400">
                      {lang === 'ar' ? 'للجمهور والزوار' : 'For Audiences'}
                    </span>
                  </div>
                  <h4 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white mt-1">
                    {lang === 'ar' ? 'الفعاليات والأنشطة الترفيهية والتعليمية' : 'Events, Entertainment & Education'}
                  </h4>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-medium my-4 leading-relaxed">
              {lang === 'ar'
                ? 'الوجهة المركزية لاكتشاف وحجز مختلف التجارب الحية في مصر مع إمكانية استعراض المواعيد، المواقع، وتأكيد التذاكر.'
                : 'The central hub for discovering and booking various live experiences in Egypt with schedules, venues, and ticket confirmations.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                <div className="p-2 rounded-xl bg-red-500/10 text-red-500 shrink-0 mt-0.5">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {lang === 'ar' ? 'الحفلات والسهرات' : 'Parties & Nightlife'}
                  </h5>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                    {lang === 'ar' ? 'حفلات لاتيني (سالسا، باتشاتا، كيزومبا)، حفلات شرقية وغربية، وسهرات مميزة.' : 'Latin parties (Salsa, Bachata, Kizomba), oriental & western nights, and DJ events.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 shrink-0 mt-0.5">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {lang === 'ar' ? 'الكورسات وورش العمل' : 'Courses & Workshops'}
                  </h5>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                    {lang === 'ar' ? 'تعليم الرقص بجميع المستويات، ورش الفنون والإبداع، وتدريبات اللياقة والموسيقى.' : 'Dance lessons for all levels, art & creativity workshops, fitness, and music.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                  <Plane className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {lang === 'ar' ? 'الرحلات والمهرجانات' : 'Trips & Festivals'}
                  </h5>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                    {lang === 'ar' ? 'رحلات الرقص السياحية، معسكرات التخييم والسفاري، والمهرجانات الكبرى الدولية والمحلية.' : 'Dance getaway trips, safari camps, and major national and international festivals.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 shrink-0 mt-0.5">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {lang === 'ar' ? 'المعارض والمؤتمرات' : 'Exhibitions & Conferences'}
                  </h5>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                    {lang === 'ar' ? 'معارض الفنون والتجارة، معارض المنتجات، ومؤتمرات الأعمال والتواصل المهني.' : 'Art & trade expos, cultural fairs, and business networking conferences.'}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Pillar 2: Complementary Services & B2B Solutions */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-neutral-200 dark:border-neutral-800 relative overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                  <Wrench className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                      {lang === 'ar' ? 'الركيزة الثانية' : 'Pillar 2'}
                    </span>
                    <span className="text-xs font-semibold text-neutral-400">
                      {lang === 'ar' ? 'للمنظمين وأصحاب الأعمال' : 'For Organizers & Vendors'}
                    </span>
                  </div>
                  <h4 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white mt-1">
                    {lang === 'ar' ? 'الخدمات والشركات المكملة لصناعة الفعاليات' : 'Complementary Services & Vendors'}
                  </h4>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-medium my-4 leading-relaxed">
              {lang === 'ar'
                ? 'توفير حلقة وصل مباشرة بين منظمي الفعاليات والشركات المتخصصة في تقديم حلول لوجستية وتقنية متكاملة لإنجاح أي حدث.'
                : 'Direct connection bridging event organizers with specialized vendors offering logistical and technical event solutions.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {lang === 'ar' ? 'المقرات وتأجير القاعات' : 'Venues & Halls Rentals'}
                  </h5>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                    {lang === 'ar' ? 'استوديوهات رقص وتدريب مجهزة، قاعات احتفالات ومؤتمرات، ومساحات مفتوحة.' : 'Equipped dance & training studios, banquet halls, and open-air event spaces.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0 mt-0.5">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {lang === 'ar' ? 'المعدات والصوتيات والإضاءة' : 'Sound, Lighting & Equipment'}
                  </h5>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                    {lang === 'ar' ? 'تأجير أجهزة الصوت، هندسة الإضاءة، الشاشات العملاقة، وتجهيزات المسارح.' : 'Pro audio sound systems, stage lighting rigs, LED screens, and DJ booth rentals.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 shrink-0 mt-0.5">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {lang === 'ar' ? 'الميديا والتصوير الاحترافي' : 'Media, Video & Photography'}
                  </h5>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                    {lang === 'ar' ? 'تغطية فوتوغرافية وفيديو سينمائي، تصوير درون جوي، وصناعة ريلز دعائية.' : 'Cinematic video coverage, photography, drone shots, and viral event reels.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500 shrink-0 mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {lang === 'ar' ? 'الضيافة وتنظيم الحشود واللوجستيات' : 'Catering, Ushers & Logistics'}
                  </h5>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                    {lang === 'ar' ? 'خدمات البوفيه والمشروبات، بوابات الترحيب بالضيوف، وتنسيق الدخول.' : 'Catering, reception welcoming staff, crowd management, and gate control.'}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Pillar 3: Jobs & Careers in the Field */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-neutral-200 dark:border-neutral-800 relative overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
                  <Briefcase className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400">
                      {lang === 'ar' ? 'الركيزة الثالثة' : 'Pillar 3'}
                    </span>
                    <span className="text-xs font-semibold text-neutral-400">
                      {lang === 'ar' ? 'للمحترفين والباحثين عن عمل' : 'For Talents & Job Seekers'}
                    </span>
                  </div>
                  <h4 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white mt-1">
                    {lang === 'ar' ? 'التوظيف وسوق العمل المتخصص في صناعة الفعاليات' : 'Jobs & Careers in Event Industry'}
                  </h4>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-medium my-4 leading-relaxed">
              {lang === 'ar'
                ? 'تمكين المواهب والكوادر المهنية من العثور على فرص عمل وتعاون مع أكاديميات الفنون ومنظمي الحفلات والمهرجانات.'
                : 'Empowering specialized talents to find job vacancies and collaborations with arts academies and event organizers.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 shrink-0 mt-0.5">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {lang === 'ar' ? 'مدربون وفنانون واستعراضيون' : 'Instructors, Artists & Performers'}
                  </h5>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                    {lang === 'ar' ? 'فرص عمل لمدربي الرقص والموسيقى، عازفين، دي جي (DJs)، وفرق استعراضية.' : 'Vacancies for dance/music instructors, live musicians, DJs, and performing acts.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {lang === 'ar' ? 'فرق الأمن والتنظيم الميداني' : 'Security Staff & Gate Ushers'}
                  </h5>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                    {lang === 'ar' ? 'طلب مسؤولي تذاكر، فاحصي QR Code، أفراد أمن وحراسة، ومنظمي استعلامات.' : 'Openings for ticket checkers, QR inspectors, security personnel, and reception coordinators.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {lang === 'ar' ? 'مهندسو الصوت والإضاءة والتقنيين' : 'Sound & Light Technicians'}
                  </h5>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                    {lang === 'ar' ? 'فرص للمتخصصين في تشغيل غرف التحكم بالصوت، برمجة أجهزة الليزر والإضاءة المسرحية.' : 'Roles for audio console operators, stage lighting engineers, and video wall techs.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {lang === 'ar' ? 'تسويق وإدارة علاقات الفعاليات' : 'Event Marketing & PR Managers'}
                  </h5>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                    {lang === 'ar' ? 'إدارة السوشيال ميديا للمناسبات، منسقو الرعاة (Sponsorships)، ومديرو المبيعات.' : 'Social media managers, sponsorship coordinators, and ticketing sales associates.'}
                  </p>
                </div>
              </div>

            </div>
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
