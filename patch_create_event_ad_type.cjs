const fs = require('fs');
let code = fs.readFileSync('src/components/events/CreateEventPage.tsx', 'utf8');

// 1. Add loadPricingConfig to useApp destructuring
code = code.replace(/const { lang, user, addNewEvent, updateEvent, editingEvent, setEditingEvent, isAdminUnlocked, pricingConfig } = useApp\(\);/, 'const { lang, user, addNewEvent, updateEvent, editingEvent, setEditingEvent, isAdminUnlocked, pricingConfig, loadPricingConfig } = useApp();');

// 2. Change adType state initialization
code = code.replace(/const \[adType, setAdType\] = useState<'vip' \| 'standard'>\('vip'\);/, 'const [adType, setAdType] = useState<\'vip\' | \'standard\' | null>(null);\n  const [isLoadingPricing, setIsLoadingPricing] = useState(false);');

// 3. Wrap the form in {adType && ( ... )}
// The form ends around line 1255 where it says `</form>`
// We also need to add a loading indicator or something if pricing is loading
code = code.replace(/<form onSubmit={handleProceedToPayment} className="space-y-6">/, '{adType && (\n        <form onSubmit={handleProceedToPayment} className="space-y-6">');
code = code.replace(/<\/form>\n\s*<\/div>\n\s*<\/div>\n\s*\);/, '</form>\n        )}\n      </div>\n    </div>\n  );');

// 4. Update the onClick handlers for adType buttons
const handleVipClick = `onClick={async () => {
                setIsLoadingPricing(true);
                await loadPricingConfig();
                setAdType('vip');
                setIsLoadingPricing(false);
              }}`;
code = code.replace(/onClick=\{\(\) => setAdType\('vip'\)\}/, handleVipClick);

const handleStandardClick = `onClick={async () => {
                setIsLoadingPricing(true);
                await loadPricingConfig();
                setAdType('standard');
                setIsLoadingPricing(false);
              }}`;
code = code.replace(/onClick=\{\(\) => setAdType\('standard'\)\}/, handleStandardClick);

// 5. Add a loading spinner next to the "Ad Type" or somewhere if isLoadingPricing
// Actually, we can just disable the buttons while loading or show a spinner inside them.
code = code.replace(/<Crown className="h-5 w-5 text-amber-500" \/>\n\s*\{lang === 'ar' \? 'نوع الإعلان' : 'Ad Type'\}/, '<Crown className="h-5 w-5 text-amber-500" />\n            {lang === \'ar\' ? \'نوع الإعلان\' : \'Ad Type\'}\n            {isLoadingPricing && <Sparkles className="h-5 w-5 animate-spin text-amber-500 ml-2" />}');

fs.writeFileSync('src/components/events/CreateEventPage.tsx', code);
