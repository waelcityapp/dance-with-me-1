const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf8');

const featuredState = `  const [adminIsFeatured, setAdminIsFeatured] = useState(true);
  const [adminEventsFilter, setAdminEventsFilter] = useState<'all' | 'empty' | 'paused' | 'active' | 'available'>('all');
`;

code = code.replace(featuredState, '');
code = code.replace(/const \[adminIsWeeklyPromo, setAdminIsWeeklyPromo\] = useState\(false\);/, 
  `const [adminIsWeeklyPromo, setAdminIsWeeklyPromo] = useState(false);
${featuredState}`);

fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
console.log('Fixed admin draft order');
