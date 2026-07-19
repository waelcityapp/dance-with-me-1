const fs = require('fs');
let code = fs.readFileSync('src/components/profile/ProfileView.tsx', 'utf8');

const target = `            </motion.div>
          )}
        </AnimatePresence>`;

const replacement = `            </motion.div>
              )}
            </AnimatePresence>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  console.log("Replaced end tags!");
}

fs.writeFileSync('src/components/profile/ProfileView.tsx', code);
