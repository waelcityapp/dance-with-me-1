const fs = require('fs');
let code = fs.readFileSync('src/components/profile/ProfileView.tsx', 'utf8');

code = code.replace(/\{associatedEvent\?\.eventRef && \(/,
`{(sub.eventRef || associatedEvent?.eventRef) && (
                        <span className="px-3 py-1 rounded-xl bg-indigo-950/80 text-indigo-400 font-mono text-xs font-black border border-indigo-500/20">
                          {lang === 'ar' ? \`الرقم المرجعي: \${sub.eventRef || associatedEvent?.eventRef}\` : \`Ref No: \${sub.eventRef || associatedEvent?.eventRef}\`}
                        </span>
                      )}
                      {/* Old block just in case */ false && (`);

fs.writeFileSync('src/components/profile/ProfileView.tsx', code);
console.log('Fixed ProfileView ref');
