const fs = require('fs');
let code = fs.readFileSync('src/components/profile/ProfileView.tsx', 'utf8');

const regex = /\{\/\* Quick Actions \*\/\}[\s\S]*?\{showAvatarPicker && \(\s*<motion\.div[\s\S]*?className="mt-6 pt-5 border-t border-white\/10 flex flex-col items-center sm:items-start gap-3 overflow-hidden"\s*>\s*<div className="flex items-center justify-between w-full">/m;

const replacement = `{/* Quick Actions or Avatar Picker */}
            <AnimatePresence mode="wait">
              {!showAvatarPicker ? (
                <motion.div
                  key="quick-actions"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full border-t border-white/5 pt-5 overflow-hidden"
                >
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
                    className="w-full sm:w-auto mt-2 sm:mt-0 sm:ms-auto flex items-center justify-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-5 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="avatar-picker"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full border-t border-white/10 pt-5 flex flex-col items-center sm:items-start gap-3 overflow-hidden"
                >
                  <div className="flex items-center justify-between w-full">`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  console.log("Replaced!");
} else {
  console.log("Could not find regex target.");
}

fs.writeFileSync('src/components/profile/ProfileView.tsx', code);
