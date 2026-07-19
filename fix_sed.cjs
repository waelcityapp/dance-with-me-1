const fs = require('fs');
let code = fs.readFileSync('src/components/profile/ProfileView.tsx', 'utf8');

// Replace all instances of `)}\n      </div>` with `</div>`
code = code.split(')}\n      </div>').join('</div>');

fs.writeFileSync('src/components/profile/ProfileView.tsx', code);
console.log('Fixed sed mistake');
