const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminEditEventPage.tsx', 'utf8');

const targetStr = `      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Core Info */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 space-y-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-amber-500" />
            {lang === 'ar' ? 'البيانات الأساسية' : 'Core Information'}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">`;

const newStr = `      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Core Info */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 space-y-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-amber-500" />
            {lang === 'ar' ? 'البيانات الأساسية' : 'Core Information'}
          </h2>

          {editingEvent?.eventRef && (
            <div className="space-y-2 mb-6 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
              <label className="text-sm font-bold text-indigo-400">
                {lang === 'ar' ? 'كود الحدث (الرقم المرجعي)' : 'Event Code (Reference)'}
              </label>
              <input
                disabled
                type="text"
                value={editingEvent.eventRef}
                className="w-full bg-neutral-950/50 border border-indigo-500/30 rounded-xl px-4 py-3 text-indigo-300 font-mono font-bold select-all focus:outline-none opacity-80 cursor-not-allowed"
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">`;

code = code.replace(targetStr, newStr);

fs.writeFileSync('src/components/admin/AdminEditEventPage.tsx', code);
console.log('Fixed admin edit page');
