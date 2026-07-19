const fs = require('fs');
let code = fs.readFileSync('src/components/events/CreateEventPage.tsx', 'utf8');

const target = 'className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 px-4 text-xs sm:text-sm font-mono text-white outline-none focus:border-amber-500"';
const replacement = `className={\`w-full rounded-xl border \${mapsUrlError ? 'border-red-500 bg-red-950/20' : 'border-neutral-800 bg-neutral-950 focus:border-amber-500'} py-3 px-4 text-xs sm:text-sm font-mono text-white outline-none transition-colors shadow-inner\`}`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/events/CreateEventPage.tsx', code);
console.log('Fixed google maps input className');
