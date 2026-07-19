const fs = require('fs');
let code = fs.readFileSync('src/components/profile/ProfileView.tsx', 'utf8');

const regex = /<motion\.div\s*key="avatar-picker"[\s\S]*?<div className="flex items-center justify-between w-full">\s*<span[\s\S]*?<\/button>\s*<\/div>\s*<motion\.div[\s\S]*?<div className="flex items-center justify-between w-full">\s*<span[\s\S]*?<\/button>\s*<\/div>/m;

const replacement = `<motion.div
                  key="avatar-picker"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full border-t border-white/10 pt-5 flex flex-col items-center sm:items-start gap-3 overflow-hidden"
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-xs font-mono text-amber-300 font-bold flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      {lang === 'ar' ? 'اختر أيقونة لملفك الشخصي:' : 'Select a Profile Avatar:'}
                    </span>
                    <button onClick={() => setShowAvatarPicker(false)} className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded-md bg-neutral-800 border border-white/10">✕ {lang === 'ar' ? 'إغلاق' : 'Close'}</button>
                  </div>`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  console.log("Replaced using regex");
} else {
  console.log("Regex not found");
}

fs.writeFileSync('src/components/profile/ProfileView.tsx', code);
