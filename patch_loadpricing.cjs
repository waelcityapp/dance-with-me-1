const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

// 1. Add to interface
code = code.replace(/updatePricingConfig: \(config: PricingConfig\) => Promise<boolean>;/, 'updatePricingConfig: (config: PricingConfig) => Promise<boolean>;\n  loadPricingConfig: () => Promise<void>;');

// 2. Add to return object
code = code.replace(/updatePricingConfig\n\s*\}\}>/, 'updatePricingConfig,\n      loadPricingConfig\n    }}>');

fs.writeFileSync('src/context/AppContext.tsx', code);
