const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf8');

code = code.replace(
`export type TabType = 'explore' | 'parties' | 'courses' | 'trips' | 'profile' | 'create_ad' | 'admin' | 'edit_ad_admin';`,
`export type TabType = 'explore' | 'parties' | 'courses' | 'trips' | 'profile' | 'create_ad' | 'admin' | 'edit_ad_admin' | 'verification';`
);

fs.writeFileSync('src/types/index.ts', code);
