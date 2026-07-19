const fs = require('fs');
let code = fs.readFileSync('src/components/profile/ProfileView.tsx', 'utf8');
code = code.replace('{/* Booking Deletion Confirmation Modals */}', '</div>\n\n      {/* Booking Deletion Confirmation Modals */}');
fs.writeFileSync('src/components/profile/ProfileView.tsx', code);
console.log('Fixed');
