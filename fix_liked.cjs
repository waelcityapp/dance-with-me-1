const fs = require('fs');
let code = fs.readFileSync('src/components/profile/ProfileView.tsx', 'utf8');

code = code.replace(/<\/div>\s*<\/div>\s*{\/\* Booking Deletion Confirmation Modals \*\//, '</div>\n      )}\n      </div>\n      {/* Booking Deletion Confirmation Modals */');

fs.writeFileSync('src/components/profile/ProfileView.tsx', code);
console.log('Fixed liked section');
