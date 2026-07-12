const fs = require('fs');
let code = fs.readFileSync('src/components/events/CreateEventPage.tsx', 'utf8');

code = code.replace(
/\{lang === 'ar' \? 'إضافة إعلان فيديو \(\+20% على القيمة\):' : 'Video Surcharge \(\+20% of subtotal\):'\}/g,
`{lang === 'ar' ? \`إضافة إعلان فيديو (+\${pricing.videoSurchargePercentage}% على القيمة):\` : \`Video Surcharge (+\${pricing.videoSurchargePercentage}% of subtotal):\`}`
);

fs.writeFileSync('src/components/events/CreateEventPage.tsx', code);
