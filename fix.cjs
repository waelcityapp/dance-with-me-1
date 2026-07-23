const fs = require('fs');
let code = fs.readFileSync('src/components/modals/ActualAttendanceModal.tsx', 'utf8');
code = code.replace(
  "        <motion.div flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm\">\n        <motion.div",
  "        <motion.div"
);
fs.writeFileSync('src/components/modals/ActualAttendanceModal.tsx', code);
