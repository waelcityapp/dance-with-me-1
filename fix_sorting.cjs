const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const targetSortRegex = /return \[\.\.\.filtered\]\.sort\(\(a, b\) => \{\n\s+const posA = a\.position !== undefined && a\.position !== null \? a\.position : 999999;\n\s+const posB = b\.position !== undefined && b\.position !== null \? b\.position : 999999;\n\s+if \(posA !== posB\) \{\n\s+return posA - posB;\n\s+\}\n\s+return new Date\(b\.uploadDate\)\.getTime\(\) - new Date\(a\.uploadDate\)\.getTime\(\);\n\s+\}\);/g;

const newSort = `return [...filtered].sort((a, b) => {
      const posA = a.position !== undefined && a.position !== null && a.position > 0 ? a.position : 999999;
      const posB = b.position !== undefined && b.position !== null && b.position > 0 ? b.position : 999999;
      
      const aIsVip = posA < 20;
      const bIsVip = posB < 20;

      if (aIsVip && !bIsVip) return -1;
      if (!aIsVip && bIsVip) return 1;
      
      if (aIsVip && bIsVip) {
        if (posA !== posB) {
          return posA - posB;
        }
      }
      
      return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
    });`;

code = code.replace(targetSortRegex, newSort);

fs.writeFileSync('src/context/AppContext.tsx', code);
console.log('Fixed sorting logic');
