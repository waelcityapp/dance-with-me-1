const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf8');
code = code.replace(
  /pricingConfig\?\.vip/g,
  "localPricingConfig?.vip"
).replace(
  /pricingConfig\?\.standard/g,
  "localPricingConfig?.standard"
).replace(
  /updatePricingConfig\(\{ \.\.\.pricingConfig/g,
  "setLocalPricingConfig({ ...localPricingConfig"
).replace(
  /\.\.\.pricingConfig\.vip/g,
  "...localPricingConfig?.vip"
).replace(
  /\.\.\.pricingConfig\.standard/g,
  "...localPricingConfig?.standard"
);
fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
