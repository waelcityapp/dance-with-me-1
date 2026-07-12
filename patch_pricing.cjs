const fs = require('fs');
let code = fs.readFileSync('src/components/events/CreateEventPage.tsx', 'utf8');

code = code.replace(
/const getPriceBreakdown = \(\) => \{\n    const defaultPricing = \{ basePrice: 100, extraDayPrice: 20, videoSurchargePercentage: 20 \};\n    const config = pricingConfig\?\.\[adType\] \|\| pricingConfig\?\.vip \|\| defaultPricing;\n    const days = Math\.max\(7, subscriptionDays \|\| 7\);\n    const basePrice = Number\(config\?\.basePrice\) \|\| 100;\n    const extraDays = days - 7;\n    const extraPrice = extraDays \* \(Number\(config\?\.extraDayPrice\) \|\| 20\);\n    const subtotal = basePrice \+ extraPrice;\n    const videoSurcharge = mediaType === 'video' \? Math\.round\(subtotal \* \(\(Number\(config\?\.videoSurchargePercentage\) \|\| 20\) \/ 100\)\) : 0;\n    const total = subtotal \+ videoSurcharge;\n    return \{\n      days,\n      basePrice,\n      extraDays,\n      extraPrice,\n      subtotal,\n      videoSurcharge,\n      total\n    \};\n  \};/,
`const getPriceBreakdown = () => {
    const defaultPricing = { basePrice: 100, extraDayPrice: 20, videoSurchargePercentage: 20 };
    const config = pricingConfig?.[adType] || pricingConfig?.vip || defaultPricing;
    const days = Math.max(7, subscriptionDays || 7);
    const basePrice = Number(config?.basePrice) || 100;
    const extraDayRate = Number(config?.extraDayPrice) || 20;
    const videoSurchargePercentage = Number(config?.videoSurchargePercentage) || 20;
    const extraDays = days - 7;
    const extraPrice = extraDays * extraDayRate;
    const subtotal = basePrice + extraPrice;
    const videoSurcharge = mediaType === 'video' ? Math.round(subtotal * (videoSurchargePercentage / 100)) : 0;
    const total = subtotal + videoSurcharge;
    return {
      days,
      basePrice,
      extraDayRate,
      videoSurchargePercentage,
      extraDays,
      extraPrice,
      subtotal,
      videoSurcharge,
      total
    };
  };`);

fs.writeFileSync('src/components/events/CreateEventPage.tsx', code);
