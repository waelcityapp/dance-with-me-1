import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, Music, GraduationCap, Palmtree, User } from 'lucide-react';
import { motion } from 'motion/react';
import { TabType } from '../../types';
import { DEFAULT_NEUTRAL_AVATAR } from '../../utils/avatars';

interface BottomNavProps {
  onOpenPersonalNotifications?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenPersonalNotifications }) => {
  const { activeTab, setActiveTab, lang, setSelectedCategory, user, userAdSubmissions, bookings, supportMessages } = useApp();
  
  // Calculate unread counts
  const unreadAdsCount = userAdSubmissions?.filter(s => (s.status === 'approved' || s.status === 'rejected') && s.userRead === false).length || 0;
  const unreadBookingsCount = bookings?.filter(b => (b.status === 'approved' || b.status === 'rejected') && b.userRead === false).length || 0;
  const unreadMessagesCount = supportMessages?.filter(m => m.status === 'replied' && m.userRead === false).length || 0;
  const totalUnreadCount = unreadAdsCount + unreadBookingsCount + unreadMessagesCount;

  const tabs: { id: TabType; labelAr: string; labelEn: string; icon: React.ElementType; category?: any }[] = [
    { id: 'explore', labelAr: 'الرئيسية', labelEn: 'Explore', icon: Sparkles, category: 'all' },
    { id: 'parties', labelAr: 'الحفلات', labelEn: 'Parties', icon: Music, category: 'party' },
    { id: 'courses', labelAr: 'الكورسات', labelEn: 'Courses', icon: GraduationCap, category: 'course' },
    { id: 'trips', labelAr: 'الرحلات', labelEn: 'Trips', icon: Palmtree, category: 'trip' },
    { 
      id: 'profile', 
      labelAr: user ? (user.name.trim().split(' ')[0] || 'حسابي') : 'دخول / حسابي', 
      labelEn: user ? (user.name.trim().split(' ')[0] || 'Account') : 'Account', 
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
      <div className="w-full sm:max-w-[520px] h-16 rounded-t-3xl border-t border-x sm:border border-neutral-200 dark:border-[#78101F]/50 bg-white/95 dark:bg-[#42030A]/95 backdrop-blur-xl flex items-center justify-around px-2 sm:px-4 shadow-2xl pointer-events-auto relative">
        
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isProfile = tab.id === 'profile';
          return (
            <div key={tab.id} className="relative">
              <button
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
                      ? 'text-amber-500 dark:text-amber-400'
                      : 'text-neutral-500 hover:text-neutral-900 dark:text-[#E8D3C0]/70 dark:group-hover:text-white'
                  }`}
                >
                  {isProfile && user ? (
                    <div className="relative">
                      <img
                        src={user.avatar || DEFAULT_NEUTRAL_AVATAR}
                        alt={user.name || 'User Avatar'}
                        className={`h-5 w-5 sm:h-6 sm:w-6 rounded-full object-cover transition-all ${
                          isActive ? 'border-2 border-amber-400 shadow-md' : 'border border-neutral-300 dark:border-[#78101F]'
                        }`}
                      />
                    </div>
                  ) : (
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.2]" />
                  )}
                </motion.div>
                <span
                  className={`text-[10px] sm:text-[11px] font-bold transition-colors duration-200 text-center leading-tight whitespace-nowrap max-w-[68px] truncate block ${
                    isActive
                      ? 'text-amber-600 dark:text-amber-400 font-black'
                      : 'text-neutral-600 dark:text-[#E8D3C0]/70 group-hover:text-neutral-900 dark:group-hover:text-white'
                  }`}
                >
                  {lang === 'ar' ? tab.labelAr : tab.labelEn}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabDot"
                    className="w-1.5 h-1.5 bg-amber-500 dark:bg-amber-400 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
              
              {isProfile && totalUnreadCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenPersonalNotifications) {
                      onOpenPersonalNotifications();
                    }
                  }}
                  className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white shadow-lg shadow-red-500/20 cursor-pointer z-50 hover:scale-110 transition-transform"
                >
                  {totalUnreadCount}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
};
