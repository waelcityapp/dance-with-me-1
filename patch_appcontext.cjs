const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

// 1. Add fetchPricingConfigOnce to imports
code = code.replace(/subscribeToPricingConfig,/g, 'subscribeToPricingConfig, fetchPricingConfigOnce,');

// 2. Add loadPricingConfig to the context interface
code = code.replace(/updatePricingConfig: \(newConfig: PricingConfig\) => Promise<boolean>;/g, 'updatePricingConfig: (newConfig: PricingConfig) => Promise<boolean>;\n  loadPricingConfig: () => Promise<void>;');

// 3. Add loadPricingConfig implementation
const loadPricingFunc = `
  const loadPricingConfig = async () => {
    const config = await fetchPricingConfigOnce();
    if (config) {
      setPricingConfig(config);
    }
  };
`;
code = code.replace(/const updatePricingConfig = async/g, loadPricingFunc + '\n  const updatePricingConfig = async');

// 4. Remove initial fetch and subscribe
code = code.replace(/checkAndSeedPricingConfig\(\)\.then\(\(seeded\) => {\n\s*if \(seeded\) setPricingConfig\(seeded\);\n\s*}\);/g, '');
code = code.replace(/\/\/ 2c\. Subscribe to live pricing config\n\s*const unsubPricing = subscribeToPricingConfig\(\(liveConfig\) => {\n\s*if \(liveConfig\) setPricingConfig\(liveConfig\);\n\s*}\);/g, '');

// 5. Provide loadPricingConfig
code = code.replace(/updatePricingConfig,/g, 'updatePricingConfig, loadPricingConfig,');

fs.writeFileSync('src/context/AppContext.tsx', code);
