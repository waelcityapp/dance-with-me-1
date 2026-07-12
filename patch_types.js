const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf-8');

code = code.replace(
  "export interface DanceEvent {",
  "export interface PricingConfig {\n  vip: {\n    basePrice: number;\n    extraDayPrice: number;\n    videoSurchargePercentage: number;\n  };\n  standard: {\n    basePrice: number;\n    extraDayPrice: number;\n    videoSurchargePercentage: number;\n  };\n}\n\nexport interface DanceEvent {"
);

code = code.replace(
  "position?: number;\n  adNumber?: string;\n}",
  "position?: number;\n  adNumber?: string;\n  adType?: 'vip' | 'standard';\n}"
);

code = code.replace(
  "pricing: {\n    days: number;\n    subtotal: number;\n    videoSurcharge: number;\n    total: number;\n  };\n",
  "pricing: {\n    days: number;\n    subtotal: number;\n    videoSurcharge: number;\n    total: number;\n  };\n  adType?: 'vip' | 'standard';\n"
);

fs.writeFileSync('src/types/index.ts', code);
