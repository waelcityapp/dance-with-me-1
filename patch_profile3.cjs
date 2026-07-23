const fs = require('fs');
let code = fs.readFileSync('src/components/profile/ProfileView.tsx', 'utf8');

code = code.replace(
  "import { User, PlusCircle",
  "import { User, Users, PlusCircle"
);

fs.writeFileSync('src/components/profile/ProfileView.tsx', code);
