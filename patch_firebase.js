const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf-8');

const newCode = `

/**
 * Pricing Config Management
 */
export const DEFAULT_PRICING_CONFIG = {
  vip: {
    basePrice: 100,
    extraDayPrice: 20,
    videoSurchargePercentage: 20,
  },
  standard: {
    basePrice: 50,
    extraDayPrice: 10,
    videoSurchargePercentage: 10,
  }
};

export async function checkAndSeedPricingConfig(): Promise<any> {
  try {
    const ref = doc(db, 'app_config', 'pricing');
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, DEFAULT_PRICING_CONFIG);
      return DEFAULT_PRICING_CONFIG;
    }
    return snap.data();
  } catch (error) {
    console.error('Error seeding pricing config:', error);
    return DEFAULT_PRICING_CONFIG;
  }
}

export async function updatePricingConfigToFirestore(config: any): Promise<boolean> {
  try {
    const ref = doc(db, 'app_config', 'pricing');
    await setDoc(ref, config, { merge: true });
    return true;
  } catch (error) {
    console.error('Error updating pricing config:', error);
    return false;
  }
}

export function subscribeToPricingConfig(onUpdate: (config: any) => void): () => void {
  try {
    const ref = doc(db, 'app_config', 'pricing');
    return onSnapshot(ref, (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data());
      }
    }, (error) => {
      console.warn('Firestore subscribe to pricing config error:', error);
    });
  } catch (error) {
    return () => {};
  }
}
`;

code = code.replace("export async function logAnalyticsEvent", newCode + "\nexport async function logAnalyticsEvent");

fs.writeFileSync('src/lib/firebase.ts', code);
