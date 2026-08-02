const fs = require('fs');

function replaceOrigin(path) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(
    /\(window\.location\.origin\.includes\('localhost'\) \|\| window\.location\.origin\.includes\('127\.0\.0\.1'\) \|\| window\.location\.origin\.includes\('0\.0\.0\.0'\)\n\s*\? '[^']+'\n\s*: window\.location\.origin\)/g,
    "'https://cityeve.online'"
  );
  content = content.replace(
    /\(window\.location\.origin\.includes\('localhost'\) \|\| window\.location\.origin\.includes\('127\.0\.0\.1'\) \|\| window\.location\.origin\.includes\('0\.0\.0\.0'\)\s*\?\s*'[^']+'\s*:\s*window\.location\.origin\)/g,
    "'https://cityeve.online'"
  );
  fs.writeFileSync(path, content);
}

replaceOrigin('src/components/admin/AdminPanel.tsx');
replaceOrigin('src/components/profile/ProfileView.tsx');
console.log('Origin patched');
