const fs = require('fs');
let code = fs.readFileSync('src/components/events/CreateEventPage.tsx', 'utf8');

const targetStr = `        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Title AR / EN */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-amber-400 font-mono tracking-wider uppercase">
              {lang === 'ar' ? '1. عنوان الفعالية' : '1. Event Title'}
            </h4>`;

const newStr = `        <form onSubmit={handleFormSubmit} className="space-y-6">

          {/* Event Code (when editing) */}
          {editingEvent?.eventRef && (
            <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 mb-6">
              <label className="block text-xs font-bold text-indigo-400 mb-1.5">
                {lang === 'ar' ? 'كود الحدث (الرقم المرجعي)' : 'Event Code (Reference)'}
              </label>
              <input
                disabled
                type="text"
                value={editingEvent.eventRef}
                className="w-full bg-neutral-900/50 border border-indigo-500/30 rounded-xl px-4 py-2 text-indigo-300 font-mono font-bold select-all focus:outline-none opacity-80 cursor-not-allowed"
              />
            </div>
          )}

          {/* Title AR / EN */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-amber-400 font-mono tracking-wider uppercase">
              {lang === 'ar' ? '1. عنوان الفعالية' : '1. Event Title'}
            </h4>`;

code = code.replace(targetStr, newStr);
fs.writeFileSync('src/components/events/CreateEventPage.tsx', code);
console.log('Fixed create event page');
