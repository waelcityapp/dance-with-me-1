const fs = require('fs');
let code = fs.readFileSync('src/components/profile/ProfileView.tsx', 'utf8');

const target = `      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-neutral-900 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-900/90 dark:to-neutral-950 p-6 sm:p-8 shadow-2xl gold-glow"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-start">
          <div className="relative group cursor-pointer flex flex-col items-center" onClick={() => setShowAvatarPicker(!showAvatarPicker)}>
            <img
              src={user.avatar || DEFAULT_NEUTRAL_AVATAR}
              alt={user.name}
              className="h-24 w-24 rounded-2xl object-cover border-2 border-amber-400 shadow-xl transition-transform group-hover:scale-105"
            />
            <span className="mt-1.5 text-[11px] font-mono font-bold text-amber-300 underline underline-offset-2">
              {lang === 'ar' ? 'تغيير الصورة' : 'Change Photo'}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h2 className="text-2xl font-extrabold text-white">{user.name}</h2>
              <span className={\`rounded-full px-3 py-0.5 text-[10px] font-mono font-bold border \${user.isAdmin ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}\`}>
                {user.isAdmin ? (lang === 'ar' ? 'إدارة المنصة (Admin)' : 'PLATFORM ADMIN') : (lang === 'ar' ? 'عضوية النادي (VIP)' : 'VIP CLUB MEMBER')}
              </span>
            </div>
            <p className="text-xs font-mono text-neutral-400 mb-4">{user.email} • {user.phone}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mb-4">
              <span className="text-xs text-neutral-400 font-mono mr-1">{lang === 'ar' ? 'الأنماط:' : 'Styles:'}</span>
              {user.favoriteStyles.map(style => (
                <span key={style} className="rounded-md bg-white/10 px-2.5 py-0.5 text-xs font-mono font-semibold text-amber-300 border border-white/10">
                  #{style}
                </span>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 border-t border-white/10">
              <button
                onClick={onOpenCreateModal}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-400 shadow-md gold-glow transition-all"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{lang === 'ar' ? 'إضافة إعلان' : 'Post Ad'}</span>
              </button>

              <button
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors"
              >
                {lang === 'ar' ? 'اختيار أيقونة' : 'Choose Avatar'}
              </button>

              <button
                onClick={handleOpenEditProfile}
                className="rounded-xl border border-white/10 bg-neutral-800 px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-700 transition-colors"
              >
                {lang === 'ar' ? 'تعديل الملف' : 'Edit Profile'}
              </button>

              <button
                onClick={logoutUser}
                className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-600/10 px-3.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-600 hover:text-white transition-all ml-auto"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'خروج' : 'Logout'}</span>
              </button>
            </div>
          </div>
        </div>`;

const replacement = `      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-neutral-900 dark:bg-neutral-900 p-6 sm:p-8 shadow-2xl"
      >
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
        
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="shrink-0 flex flex-col items-center gap-3">
            <div 
              className="relative group cursor-pointer" 
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            >
              <img
                src={user.avatar || DEFAULT_NEUTRAL_AVATAR}
                alt={user.name}
                className="h-28 w-28 rounded-full object-cover border-4 border-neutral-800 shadow-xl transition-transform group-hover:scale-105 group-hover:border-amber-400"
              />
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs font-bold">{lang === 'ar' ? 'تعديل' : 'Edit'}</span>
              </div>
            </div>
            <button 
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="text-xs font-semibold text-amber-500 hover:text-amber-400 underline-offset-4 hover:underline transition-all"
            >
              {lang === 'ar' ? 'تغيير الصورة' : 'Change Photo'}
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-start w-full">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 mb-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{user.name}</h2>
              {user.isAdmin ? (
                <span className="rounded-lg bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-400 border border-red-500/20 flex items-center gap-1">
                  {lang === 'ar' ? 'مدير المنصة (Admin)' : 'PLATFORM ADMIN'}
                </span>
              ) : (
                <span className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-300 border border-amber-500/20">
                  {lang === 'ar' ? 'عضوية VIP' : 'VIP MEMBER'}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 text-sm font-mono text-neutral-400 mb-5">
              <span>{user.email}</span>
              <span className="hidden sm:inline text-neutral-600">•</span>
              <span dir="ltr">{user.phone}</span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-6">
              <span className="text-xs text-neutral-500 font-bold ml-1">{lang === 'ar' ? 'الأنماط:' : 'Styles:'}</span>
              {user.favoriteStyles.map(style => (
                <span key={style} className="rounded-md bg-neutral-800 px-3 py-1 text-xs font-semibold text-neutral-300 border border-white/5 shadow-sm">
                  {style}
                </span>
              ))}
              <button 
                onClick={handleOpenEditProfile}
                className="rounded-md bg-neutral-800/50 px-3 py-1 text-xs font-semibold text-amber-500 hover:bg-neutral-800 hover:text-amber-400 border border-dashed border-amber-500/30 transition-colors"
                title={lang === 'ar' ? 'إضافة/تعديل' : 'Add/Edit'}
              >
                +
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full border-t border-white/5 pt-5">
              <button
                onClick={onOpenCreateModal}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-neutral-950 hover:bg-amber-400 shadow-md transition-all"
              >
                <PlusCircle className="h-4 w-4" />
                <span>{lang === 'ar' ? 'إضافة إعلان' : 'Post Ad'}</span>
              </button>

              <button
                onClick={handleOpenEditProfile}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-neutral-800 border border-white/10 px-5 py-2.5 text-sm font-bold text-neutral-200 hover:bg-neutral-700 transition-all"
              >
                <Edit3 className="h-4 w-4" />
                <span>{lang === 'ar' ? 'تعديل البيانات' : 'Edit Profile'}</span>
              </button>

              <button
                onClick={logoutUser}
                className="w-full sm:w-auto mt-2 sm:mt-0 sm:mr-auto flex items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-5 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
              </button>
            </div>
          </div>
        </div>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/profile/ProfileView.tsx', code);
console.log('Fixed profile header');
