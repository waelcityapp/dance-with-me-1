const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');
const fetchFunc = `
export async function fetchPricingConfigOnce() {
  try {
    const ref = doc(db, 'app_config', 'pricing');
    const docSnap = await getDoc(ref);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (error) {
    console.error('Error fetching pricing config:', error);
  }
  return null;
}
`;
code = code.replace('export function subscribeToPricingConfig', fetchFunc + '\nexport function subscribeToPricingConfig');
fs.writeFileSync('src/lib/firebase.ts', code);
