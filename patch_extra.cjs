const fs = require('fs');
let code = fs.readFileSync('src/components/events/CreateEventPage.tsx', 'utf8');

code = code.replace(
/`تكلفة الأيام الإضافية \(\$\{pricing\.extraDays\} يوم × 20 ج\.م\):`/g,
`\`تكلفة الأيام الإضافية (\${pricing.extraDays} يوم × \${pricing.extraDayRate} ج.م):\``
);

code = code.replace(
/`Extra Days \(\$\{pricing\.extraDays\} days × 20 EGP\):`/g,
`\`Extra Days (\${pricing.extraDays} days × \${pricing.extraDayRate} EGP):\``
);

fs.writeFileSync('src/components/events/CreateEventPage.tsx', code);
