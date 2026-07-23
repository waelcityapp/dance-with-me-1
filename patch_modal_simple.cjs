const fs = require('fs');
let code = fs.readFileSync('src/components/modals/ActualAttendanceModal.tsx', 'utf8');
code = code.replace(
  "<motion.div",
  "<div"
);
code = code.replace(
  "          initial={{ opacity: 0, scale: 0.95 }}\n          animate={{ opacity: 1, scale: 1 }}\n          exit={{ opacity: 0, scale: 0.95 }}\n",
  ""
);
code = code.replace(
  "        </motion.div>",
  "        </div>"
);
fs.writeFileSync('src/components/modals/ActualAttendanceModal.tsx', code);
