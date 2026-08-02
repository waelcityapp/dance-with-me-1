const fs = require('fs');

const path = 'src/components/events/EventCard.tsx';
let content = fs.readFileSync(path, 'utf8');

const modalCode = `      {/* Delete Confirmation Modal for Admins */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trash2 className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white">
                {lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Deletion'}
              </h3>
              <p className="text-sm text-neutral-400">
                {lang === 'ar' ? 'هل أنت متأكد من حذف هذا الإعلان نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.' : 'Are you sure you want to permanently delete this ad? This action cannot be undone.'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-px bg-neutral-800">
              <button
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                className="bg-neutral-900 py-4 text-sm font-bold text-neutral-300 hover:bg-neutral-800 transition-colors"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                  deleteEvent(event.id);
                }}
                className="bg-neutral-900 py-4 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors"
              >
                {lang === 'ar' ? 'حذف الإعلان' : 'Delete Ad'}
              </button>
            </div>
          </div>
        </div>
      )}`;

if (!content.includes('showDeleteConfirm && (')) {
  content = content.replace('    </motion.div>', modalCode + '\n    </motion.div>');
  fs.writeFileSync(path, content);
  console.log('Patch applied.');
} else {
  console.log('Already patched.');
}
