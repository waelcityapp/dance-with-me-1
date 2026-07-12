const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf8');
code = code.replace(
  /<span className="text-emerald-400 text-xs font-bold bg-emerald-500\/10 px-3 py-2 rounded-lg border border-emerald-500\/30">\s*\{lang === 'ar' \? '✅ يتم حفظ التعديلات فورياً في قاعدة البيانات' : '✅ Changes are saved instantly to database'\}\s*<\/span>/,
  `<button
                onClick={async () => {
                  setSavingPricing(true);
                  await updatePricingConfig(localPricingConfig as any);
                  setSavingPricing(false);
                }}
                disabled={savingPricing}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              >
                {savingPricing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {lang === 'ar' ? 'حفظ الأسعار في قاعدة البيانات' : 'Save Prices to Database'}
              </button>`
);
fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
