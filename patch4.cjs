const fs = require('fs');
let code = fs.readFileSync('src/components/events/CreateEventPage.tsx', 'utf8');

const regex = /const getPriceBreakdown = \(\) => \{[\s\S]*?return \{[\s\S]*?\};\n  \};/;

const replacement = `const getPriceBreakdown = () => {
    const defaultPricing = { basePrice: 100, extraDayPrice: 20, videoSurchargePercentage: 20 };
    const config = pricingConfig?.[adType] || pricingConfig?.vip || defaultPricing;
    const days = Math.max(7, subscriptionDays || 7);
    const basePrice = Number(config?.basePrice) || 100;
    const extraDays = days - 7;
    const extraPrice = extraDays * (Number(config?.extraDayPrice) || 20);
    const subtotal = basePrice + extraPrice;
    const videoSurcharge = mediaType === 'video' ? Math.round(subtotal * ((Number(config?.videoSurchargePercentage) || 20) / 100)) : 0;
    const total = subtotal + videoSurcharge;
    return {
      days,
      basePrice,
      extraDays,
      extraPrice,
      subtotal,
      videoSurcharge,
      total
    };
  };`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/events/CreateEventPage.tsx', code);
