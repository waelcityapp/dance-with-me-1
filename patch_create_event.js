const fs = require('fs');
let code = fs.readFileSync('src/components/events/CreateEventPage.tsx', 'utf-8');

code = code.replace(
  "const { lang, user, addNewEvent, updateEvent, editingEvent, setEditingEvent, isAdminUnlocked } = useApp();",
  "const { lang, user, addNewEvent, updateEvent, editingEvent, setEditingEvent, isAdminUnlocked, pricingConfig } = useApp();\n  const [adType, setAdType] = useState<'vip' | 'standard'>('vip');"
);

code = code.replace(
  "  const getPriceBreakdown = () => {\n    const days = Math.max(7, subscriptionDays);\n    const basePrice = 100;\n    const extraDays = days - 7;\n    const extraPrice = extraDays * 20;\n    const subtotal = basePrice + extraPrice;\n    const videoSurcharge = mediaType === 'video' ? Math.round(subtotal * 0.2) : 0;\n    const total = subtotal + videoSurcharge;",
  "  const getPriceBreakdown = () => {\n    const config = pricingConfig[adType] || pricingConfig.vip;\n    const days = Math.max(7, subscriptionDays);\n    const basePrice = config.basePrice;\n    const extraDays = days - 7;\n    const extraPrice = extraDays * config.extraDayPrice;\n    const subtotal = basePrice + extraPrice;\n    const videoSurcharge = mediaType === 'video' ? Math.round(subtotal * (config.videoSurchargePercentage / 100)) : 0;\n    const total = subtotal + videoSurcharge;"
);

// We need to pass adType to payment and submission
code = code.replace(
  "adNumber: adNumber || `ADM-${Date.now()}`",
  "adNumber: adNumber || `ADM-${Date.now()}`,\n          adType"
);

code = code.replace(
  "isWeeklyPromo: false",
  "isWeeklyPromo: false,\n          adType"
);

// We also need to add a radio group for the user to choose VIP or Standard. 
// We will insert it right before the Step 1 header in the return block, or maybe as part of Step 1.
// Let's find "Step 1: Event Details"
fs.writeFileSync('src/components/events/CreateEventPage.tsx', code);
