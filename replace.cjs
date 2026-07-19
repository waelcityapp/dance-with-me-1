const fs = require('fs');
let code = fs.readFileSync('src/components/profile/ProfileView.tsx', 'utf8');

const startStr = "{activeSection === 'overview' ? (";
const endStr = "{activeSection === 'archive' && (";

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const tabsCode = `
      {/* Sticky Modern Tab Bar */}
      <div className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md pt-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-white/5 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 snap-x">
          <button
            onClick={() => setActiveSection('booked')}
            className={\`shrink-0 snap-start flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all \${activeSection === 'booked' || activeSection === 'overview' ? 'bg-amber-500 text-neutral-950 shadow-md gold-glow' : 'bg-neutral-900 border border-white/5 text-neutral-400 hover:text-white'}\`}
          >
            <Ticket className="h-4 w-4" />
            <span>{lang === 'ar' ? 'تذاكري' : 'Bookings'}</span>
            <span className={\`ml-1 rounded-full px-2 py-0.5 text-[10px] \${activeSection === 'booked' || activeSection === 'overview' ? 'bg-neutral-950/20' : 'bg-neutral-800'}\`}>{bookedEvents.length}</span>
          </button>
          
          <button
            onClick={() => setActiveSection('liked')}
            className={\`shrink-0 snap-start flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all \${activeSection === 'liked' ? 'bg-red-500 text-white shadow-md shadow-red-500/20' : 'bg-neutral-900 border border-white/5 text-neutral-400 hover:text-white'}\`}
          >
            <Heart className="h-4 w-4" />
            <span>{lang === 'ar' ? 'المفضلة' : 'Favorites'}</span>
            <span className={\`ml-1 rounded-full px-2 py-0.5 text-[10px] \${activeSection === 'liked' ? 'bg-black/20' : 'bg-neutral-800'}\`}>{likedEvents.length}</span>
          </button>
          
          <button
            onClick={() => setActiveSection('ads')}
            className={\`shrink-0 snap-start flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all \${activeSection === 'ads' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'bg-neutral-900 border border-white/5 text-neutral-400 hover:text-white'}\`}
          >
            <FileText className="h-4 w-4" />
            <span>{lang === 'ar' ? 'إعلاناتي' : 'My Ads'}</span>
            <span className={\`ml-1 rounded-full px-2 py-0.5 text-[10px] \${activeSection === 'ads' ? 'bg-black/20' : 'bg-neutral-800'}\`}>{adSubmissions.length}</span>
          </button>

          <button
            onClick={() => setActiveSection('support')}
            className={\`shrink-0 snap-start flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all \${activeSection === 'support' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-neutral-900 border border-white/5 text-neutral-400 hover:text-white'}\`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>{lang === 'ar' ? 'الدعم الفني' : 'Support'}</span>
            <span className={\`ml-1 rounded-full px-2 py-0.5 text-[10px] \${activeSection === 'support' ? 'bg-black/20' : 'bg-neutral-800'}\`}>{mySupportMessages.length}</span>
          </button>

          <button
            onClick={() => setActiveSection('archive')}
            className={\`shrink-0 snap-start flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all \${activeSection === 'archive' ? 'bg-neutral-700 text-white shadow-md' : 'bg-neutral-900 border border-white/5 text-neutral-400 hover:text-white'}\`}
          >
            <Clock className="h-4 w-4" />
            <span>{lang === 'ar' ? 'الأرشيف' : 'Archive'}</span>
            <span className={\`ml-1 rounded-full px-2 py-0.5 text-[10px] \${activeSection === 'archive' ? 'bg-black/20' : 'bg-neutral-800'}\`}>{expiredEvents.length}</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Content Section */}
        {activeSection === 'archive' && (`;

  // We need to also find where the top bar was, to remove it properly.
  // We'll replace from startStr to endStr with our tabsCode
  const newCode = code.slice(0, startIndex) + tabsCode + code.slice(endIndex + endStr.length);
  fs.writeFileSync('src/components/profile/ProfileView.tsx', newCode);
  console.log("Success");
} else {
  console.log("Could not find delimiters", startIndex, endIndex);
}
