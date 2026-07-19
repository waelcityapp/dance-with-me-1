const fs = require('fs');
let code = fs.readFileSync('src/components/profile/ProfileView.tsx', 'utf8');

const target = `            </motion.div>
              )}
            </AnimatePresence>
      </motion.div>`;

const replacement = `            </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  console.log("Fixed missing divs");
} else {
  console.log("Could not find missing divs target");
}

fs.writeFileSync('src/components/profile/ProfileView.tsx', code);
