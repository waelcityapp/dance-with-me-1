const fs = require('fs');
let code = fs.readFileSync('src/components/events/CreateEventPage.tsx', 'utf8');

code = code.replace(
/\{lang === 'ar' \? 'اختر مدة اشتراك الإعلان \(بالأيام\):' : 'Select Ad Duration \(in Days\):'\}/g,
`{lang === 'ar' ? \`اختر مدة اشتراك الإعلان (\${adType === 'vip' ? 'مميز' : 'عادي'}) (بالأيام):\` : \`Select Ad Duration (\${adType === 'vip' ? 'VIP' : 'Standard'}) (in Days):\`}`
);

fs.writeFileSync('src/components/events/CreateEventPage.tsx', code);
