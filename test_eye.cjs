const fs = require('fs');

let content = fs.readFileSync('src/components/events/EventCard.tsx', 'utf8');

const target = `            {/* Action Buttons */}
            {isFavoritesTab ? (`;

const replace = `            {/* Action Buttons */}
            {user?.isAdmin && (
              <div className="flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20" title={lang === 'ar' ? 'عدد مشاهدات الإعلان' : 'Ad Views Count'}>
                <Eye className="h-4 w-4" />
                <span className="font-mono">{event.viewsCount || 0}</span>
              </div>
            )}
            
            {isFavoritesTab ? (`;

content = content.replace(target, replace);
fs.writeFileSync('src/components/events/EventCard.tsx', content);
console.log('done eye');
