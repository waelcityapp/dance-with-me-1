import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, Music, GraduationCap, Palmtree, User } from 'lucide-react';
import { motion } from 'motion/react';
import { TabType } from '../../types';
import { DEFAULT_NEUTRAL_AVATAR } from '../../utils/avatars';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, lang, setSelectedCategory, user } = useApp();

  const tabs: { id: TabType; labelAr: string; labelEn: string; icon: React.ElementType; category?: any }[] = [
    { id: 'explore', labelAr: 'الرئيسية', labelEn: 'Explore', icon: Sparkles, category: 'all' },
    { id: 'parties', labelAr: 'الحفلات', labelEn: 'Parties', icon: Music, category: 'party' },
    { id: 'courses', labelAr: 'الكورسات', labelEn: 'Courses', icon: GraduationCap, category: 'course' },
    { id: 'trips', labelAr: 'الرحلات', labelEn: 'Trips', icon: Palmtree, category: 'trip' },
    { 
      id: 'profile', 
      labelAr: user ? 'حسابي' : 'إنشاء حساب أو دخول', 
      labelEn: user ? 'Account' : 'Login / Register', 
      icon: User 
    }
  ];

  const handleTabClick = (tab: typeof tabs[0]) => {
    setActiveTab(tab.id);
    if (tab.category) {
      setSelectedCategory(tab.category);
    }
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 flex justify-center z-[100] pointer-events-none">
      <div className="w-full sm:max-w-[520px] h-16 rounded-t-2xl border-t border-x sm:border border-neutral-800/80 bg-neutral-950/95 backdrop-blur-xl flex items-center justify-around px-2 sm:px-4 shadow-2xl pointer-events-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isProfile = tab.id === 'profile';

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className="group relative flex flex-col items-center justify-center gap-1 py-1 px-1.5 min-w-[54px] focus:outline-none cursor-pointer"
            >
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  y: isActive ? -1 : 0
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`relative flex items-center justify-center transition-colors duration-200 ${
                  isActive
                    ? 'text-amber-400'
                    : 'text-neutral-500 group-hover:text-white'
                }`}
              >
                {isProfile && user ? (
                  <img
                    src={user.avatar || DEFAULT_NEUTRAL_AVATAR}
                    alt={user.name || 'User Avatar'}
                    className={`h-5 w-5 sm:h-6 sm:w-6 rounded-full object-cover transition-all ${
                      isActive ? 'border-2 border-amber-400 shadow-lg gold-glow' : 'border border-neutral-600 group-hover:border-white'
                    }`}
                  />
                ) : (
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2]" />
                )}
              </motion.div>

              <span
                className={`text-[9px] sm:text-[10px] font-medium transition-colors duration-200 text-center leading-tight whitespace-nowrap ${
                  isActive
                    ? 'text-amber-400 font-bold'
                    : 'text-neutral-500 group-hover:text-white'
                }`}
              >
                {lang === 'ar' ? tab.labelAr : tab.labelEn}
              </span>

              {/* Glowing Gold Active Indicator Dot */}
              {isActive && (
                <motion.div
                  layoutId="activeTabDot"
                  className="w-1.5 h-1.5 bg-amber-400 rounded-full gold-glow"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
