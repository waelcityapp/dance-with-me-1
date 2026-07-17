const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf8');
code = code.replace("await saveAdSubmissionToFirestore(updated);", "updateLocalStorageItem(updated);\n      await saveAdSubmissionToFirestore(updated);");
code = code.replace("  };\n  };", "  };");
fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
