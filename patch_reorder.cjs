const fs = require('fs');
let code = fs.readFileSync('src/components/events/CreateEventPage.tsx', 'utf8');

// 1. We have the "Select Ad Category" block:
// <div className="border-b border-white/10 pb-5">
//   <h3 className="text-lg font-bold text-white flex items-center gap-2">
//     <Tag className="h-5 w-5 text-amber-400" />
//     <span>{lang === 'ar' ? 'اختر تصنيف الإعلان' : 'Select Ad Category'}</span>
//   ...
//   </div>
// </div>

// 2. We have the "Ad Type Selection" block:
// {/* Ad Type Selection */}
// <div className="rounded-3xl border border-neutral-800 bg-neutral-900/50 p-6 sm:p-8 relative">
// ...
// </div>

// We need to swap them!
// And put the adType condition around the Category block and the Form.

const catRegex = /<div className="border-b border-white\/10 pb-5">[\s\S]*?<\/div>\s*<\/div>/;
const catMatch = code.match(catRegex);

const adTypeRegex = /\/\* Ad Type Selection \*\/[\s\S]*?<div className="rounded-3xl border border-neutral-800 bg-neutral-900\/50 p-6 sm:p-8 relative">[\s\S]*?<\/div>\s*<\/div>/;
const adTypeMatch = code.match(adTypeRegex);

if (catMatch && adTypeMatch) {
  code = code.replace(catRegex, '___CATEGORY_BLOCK___');
  code = code.replace(adTypeRegex, '___ADTYPE_BLOCK___');
  
  // Now replace back in the new order
  code = code.replace('___CATEGORY_BLOCK___', adTypeMatch[0]);
  code = code.replace('___ADTYPE_BLOCK___', '{adType && (\\n        <>\n          ' + catMatch[0]);
}

// Ensure the closing of adType condition is fixed.
// Right now we have:
//        </form>
//        )}
//      </motion.div>
// We need to change that to:
//        </form>
//        </>
//        )}
//      </motion.div>
code = code.replace(/<\/form>\s*\)\}\s*<\/motion\.div>/, '</form>\n        </>\n        )}\n      </motion.div>');

fs.writeFileSync('src/components/events/CreateEventPage.tsx', code);
