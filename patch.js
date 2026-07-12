const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf8');
code = code.replace(
  "  const [savingBranding, setSavingBranding] = useState(false);",
  `  const [savingBranding, setSavingBranding] = useState(false);
  const [localPricingConfig, setLocalPricingConfig] = useState(pricingConfig);
  const [savingPricing, setSavingPricing] = useState(false);
  useEffect(() => { setLocalPricingConfig(pricingConfig); }, [pricingConfig]);`
);
fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
