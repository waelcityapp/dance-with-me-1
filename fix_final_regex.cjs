const fs = require('fs');
let content = fs.readFileSync('src/components/events/WeeklyPromoBanner.tsx', 'utf8');

const regex = /<\/button>\s*\{\/\*\s*Media Player Container/g;

const missingBlock = `</button>
            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowDeleteConfirm(true);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-md transition-all border border-red-500/30 hover:scale-105 active:scale-95 cursor-pointer"
              title={lang === 'ar' ? 'حذف الإعلان' : 'Delete Ad'}
            >
              <Trash2 className="h-4.5 w-4.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}
      {/* Media Player Container`;

content = content.replace(regex, missingBlock);
fs.writeFileSync('src/components/events/WeeklyPromoBanner.tsx', content);

console.log('done fixing weekly promo banner with regex');
