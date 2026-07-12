const fs = require('fs');
let code = fs.readFileSync('src/components/events/CreateEventPage.tsx', 'utf8');

code = code.replace(
/\{lang === 'ar'\n\s*\? 'الأسبوع الأول 7 أيام بقيمة 100 ج.م، وكل يوم إضافي بزيادة 20 ج.م'\n\s*: 'First 7 days for 100 EGP, each extra day is \+20 EGP'\}/,
`{lang === 'ar'
                      ? \`الأسبوع الأول 7 أيام بقيمة \${pricing.basePrice} ج.م، وكل يوم إضافي بزيادة \${pricing.extraDayRate} ج.م\`
                      : \`First 7 days for \${pricing.basePrice} EGP, each extra day is +\${pricing.extraDayRate} EGP\`}`
);

fs.writeFileSync('src/components/events/CreateEventPage.tsx', code);
