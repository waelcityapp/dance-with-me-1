const fs = require('fs');
let code = fs.readFileSync('src/components/home/HomeFeed.tsx', 'utf-8');

code = code.replace(
  "// Filter events\n  const filteredEvents = activeEvents.filter(ev => {\n    // Exclude the weekly promo event if it is already displayed in the main banner at the top\n    const isPromoBannerVisible = weeklyPromoEvent && selectedCategory === 'all' && !searchQuery && selectedStyleFilter === 'all';\n    if (isPromoBannerVisible && ev.id === weeklyPromoEvent.id) {",
  "// Determine if banner is visible\n  const isPromoBannerVisible = !!(weeklyPromoEvent && selectedCategory === 'all' && !searchQuery && selectedStyleFilter === 'all');\n\n  // Filter events\n  const filteredEvents = activeEvents.filter(ev => {\n    // Exclude the weekly promo event if it is already displayed in the main banner at the top\n    if (isPromoBannerVisible && ev.id === weeklyPromoEvent.id) {"
);

fs.writeFileSync('src/components/home/HomeFeed.tsx', code);
