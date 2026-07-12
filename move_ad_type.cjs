const fs = require('fs');
let code = fs.readFileSync('src/components/events/CreateEventPage.tsx', 'utf8');

// Find the Sub-Tab Switcher
const subTabRegex = /\{\/\* Sub-Tab Switcher for Full Live Preview \(Highly prominent card\) \*\/\}/;
const subTabMatch = code.match(subTabRegex);

// Extract the Ad Type Selection block
const adTypeStart = /\{\/\* Ad Type Selection \*\/\}/;
const adTypeEnd = /\{\s*adType && \(\s*<>\s*/;

const adTypeBlockRegex = new RegExp(adTypeStart.source + '[\\s\\S]*?' + adTypeEnd.source);
const adTypeBlockMatch = code.match(adTypeBlockRegex);

if (subTabMatch && adTypeBlockMatch) {
  // Remove the Ad Type Selection block from where it is now
  code = code.replace(adTypeBlockRegex, '');
  
  // Also we need to fix the closing tags that we'll be removing from the bottom
  // Right now it closes like:
  //        </form>
  //        </>
  //        )}
  //      </motion.div>
  //      )}
  // We need to remove the `</>\n        )}` because we took out the `adType && (` that was opening it.
  code = code.replace(/<\/form>\s*<\/>\s*\)\}\s*<\/motion\.div>/, '</form>\n      </motion.div>');

  // The extracted block:
  let adTypeBlock = adTypeBlockMatch[0];
  // Remove the trailing `{adType && (` part from the extracted block
  adTypeBlock = adTypeBlock.replace(/\{\s*adType && \(\s*<>\s*/, '');
  
  // Now we need to modify the Ad Type block to make it look more like buttons
  // "The choices are buttons, they must have a distinct color and a feeling that they are buttons, not texts, so the user can click them"
  
  // Let's improve the button styling in adTypeBlock
  // Replace the vip button classes
  adTypeBlock = adTypeBlock.replace(
    /className={`relative overflow-hidden flex flex-col items-start p-4 rounded-2xl border transition-all duration-300 \$\{[\s\S]*?\}`}/,
    `className={\`relative overflow-hidden flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl border-2 transition-all duration-300 transform shadow-xl \${
                adType === 'vip' 
                  ? 'bg-gradient-to-br from-amber-500 to-amber-600 border-amber-400 text-neutral-950 scale-[1.02] ring-4 ring-amber-500/20' 
                  : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700 hover:border-amber-500/50 hover:scale-[1.01]'
              }\`}`
  );
  
  // Replace the standard button classes
  adTypeBlock = adTypeBlock.replace(
    /className={`relative overflow-hidden flex flex-col items-start p-4 rounded-2xl border transition-all duration-300 \$\{[\s\S]*?\}`}/,
    `className={\`relative overflow-hidden flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl border-2 transition-all duration-300 transform shadow-xl \${
                adType === 'standard' 
                  ? 'bg-neutral-700 border-neutral-400 text-white scale-[1.02] ring-4 ring-neutral-500/20' 
                  : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700 hover:border-neutral-500/50 hover:scale-[1.01]'
              }\`}`
  );
  
  // Update VIP button text colors
  adTypeBlock = adTypeBlock.replace(
    /<span className={`font-black text-sm sm:text-base \$\{adType === 'vip' \? 'text-amber-400' : 'text-white'\}`}>/,
    '<span className={`font-black text-lg sm:text-xl ${adType === \'vip\' ? \'text-neutral-950\' : \'text-white\'}`}>'
  );
  adTypeBlock = adTypeBlock.replace(
    /<CheckCircle className="h-5 w-5 text-amber-500" \/>/,
    '<CheckCircle className="h-6 w-6 text-neutral-950" />'
  );
  adTypeBlock = adTypeBlock.replace(
    /<p className="text-xs text-left text-neutral-400 leading-relaxed font-medium">/,
    '<p className={`text-sm text-center mt-3 leading-relaxed font-bold ${adType === \'vip\' ? \'text-neutral-900\' : \'text-neutral-400\'}`}>'
  );
  
  // Update Standard button text colors
  adTypeBlock = adTypeBlock.replace(
    /<span className={`font-black text-sm sm:text-base \$\{adType === 'standard' \? 'text-white' : 'text-white'\}`}>/,
    '<span className={`font-black text-lg sm:text-xl text-white`}>'
  );
  adTypeBlock = adTypeBlock.replace(
    /<CheckCircle className="h-5 w-5 text-neutral-300" \/>/,
    '<CheckCircle className="h-6 w-6 text-neutral-200" />'
  );
  // It has a second <p ...> text-left
  adTypeBlock = adTypeBlock.replace(
    /<p className="text-xs text-left text-neutral-400 leading-relaxed font-medium">/,
    '<p className={`text-sm text-center mt-3 leading-relaxed font-bold ${adType === \'standard\' ? \'text-neutral-200\' : \'text-neutral-400\'}`}>'
  );

  // Re-assemble:
  // 1. The AdTypeBlock
  // 2. {adType && (
  // 3. The Sub-Tab Switcher ...
  
  const insertBefore = '      {/* Sub-Tab Switcher for Full Live Preview (Highly prominent card) */}';
  
  const newContent = adTypeBlock + '\n\n      {adType && (\n        <>\n' + insertBefore;
  
  code = code.replace(insertBefore, newContent);
  
  // Close the <> right after the main sections
  // We have:
  //      {/* Full Terms Modal */}
  // So we insert it there
  code = code.replace('      {/* Full Terms Modal */}', '        </>\n      )}\n\n      {/* Full Terms Modal */}');

  fs.writeFileSync('src/components/events/CreateEventPage.tsx', code);
  console.log("Success");
} else {
  console.log("Failed to match blocks.");
}
