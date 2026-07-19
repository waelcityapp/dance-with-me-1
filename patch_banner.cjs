const fs = require('fs');
let code = fs.readFileSync('src/components/events/WeeklyPromoBanner.tsx', 'utf8');

const insertion = `
        {/* Admin Event Reference Number Badge */}
        {user?.isAdmin && promoEvent.eventRef && (
          <div className="mb-3 px-3 py-1.5 mx-4 sm:mx-6 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 font-mono text-xs flex items-center justify-between mt-2">
            <span className="font-semibold">{lang === 'ar' ? 'الرقم المرجعي (أدمن فقط):' : 'Reference Number (Admin Only):'}</span>
            <span className="font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30">{promoEvent.eventRef}</span>
          </div>
        )}
`;

code = code.replace(
  `        {/* Action Bar: Contact, Share, Like, Book in a single row */}`,
  insertion + `\n        {/* Action Bar: Contact, Share, Like, Book in a single row */}`
);

fs.writeFileSync('src/components/events/WeeklyPromoBanner.tsx', code);
