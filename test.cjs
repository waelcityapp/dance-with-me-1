const fs = require('fs');
let code = fs.readFileSync('src/components/profile/ProfileView.tsx', 'utf8');
const startStr = "{activeSection === 'overview' ? (";
const startIdx = code.indexOf(startStr);
const endIdx = code.indexOf("{activeSection === 'archive' && (");
console.log("Start text:", code.slice(startIdx, startIdx+100));
console.log("End text:", code.slice(endIdx-100, endIdx+50));
