const fs = require('fs');
let code = fs.readFileSync('src/components/home/HomeFeed.tsx', 'utf-8');

const target1 = `overrideAdType={idx < 6 ? 'vip' : 'standard'}`;
const replace1 = `overrideAdType={ev.adType || (ev.isFeatured ? 'vip' : 'standard')}`;

code = code.replace(target1, replace1);

fs.writeFileSync('src/components/home/HomeFeed.tsx', code);
