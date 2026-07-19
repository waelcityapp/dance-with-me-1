const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf8');

// Find the state declarations
const stateEndRegex = /const \[adminIsWeeklyPromo, setAdminIsWeeklyPromo\] = useState\(false\);/;

const draftEffect = `
  // Auto-save draft functionality
  const DRAFT_KEY = 'dwm_admin_ad_draft';

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.adminTitleAr) setAdminTitleAr(draft.adminTitleAr);
        if (draft.adminTitleEn) setAdminTitleEn(draft.adminTitleEn);
        if (draft.adminDescAr) setAdminDescAr(draft.adminDescAr);
        if (draft.adminDescEn) setAdminDescEn(draft.adminDescEn);
        if (draft.adminPriceAr) setAdminPriceAr(draft.adminPriceAr);
        if (draft.adminPriceEn) setAdminPriceEn(draft.adminPriceEn);
        if (draft.adminCategory) setAdminCategory(draft.adminCategory);
        if (draft.adminSelectedStyles) setAdminSelectedStyles(draft.adminSelectedStyles);
        if (draft.adminMediaType) setAdminMediaType(draft.adminMediaType);
        if (draft.adminMediaUrl) setAdminMediaUrl(draft.adminMediaUrl);
        if (draft.adminLocationNameAr) setAdminLocationNameAr(draft.adminLocationNameAr);
        if (draft.adminLocationNameEn) setAdminLocationNameEn(draft.adminLocationNameEn);
        if (draft.adminAddressAr) setAdminAddressAr(draft.adminAddressAr);
        if (draft.adminAddressEn) setAdminAddressEn(draft.adminAddressEn);
        if (draft.adminGoogleMapsUrl) setAdminGoogleMapsUrl(draft.adminGoogleMapsUrl);
        if (draft.adminPhone) setAdminPhone(draft.adminPhone);
        if (draft.adminWhatsapp) setAdminWhatsapp(draft.adminWhatsapp);
        if (draft.adminOrganizerName) setAdminOrganizerName(draft.adminOrganizerName);
        if (draft.adminEventDate) setAdminEventDate(draft.adminEventDate);
        if (draft.adminPosition) setAdminPosition(draft.adminPosition);
        if (typeof draft.adminIsFeatured !== 'undefined') setAdminIsFeatured(draft.adminIsFeatured);
        if (typeof draft.adminIsWeeklyPromo !== 'undefined') setAdminIsWeeklyPromo(draft.adminIsWeeklyPromo);
      }
    } catch (e) { console.error('Error loading draft', e); }
  }, []);

  useEffect(() => {
    const draft = {
      adminTitleAr, adminTitleEn, adminDescAr, adminDescEn, adminPriceAr, adminPriceEn,
      adminCategory, adminSelectedStyles, adminMediaType, adminMediaUrl,
      adminLocationNameAr, adminLocationNameEn, adminAddressAr, adminAddressEn, adminGoogleMapsUrl,
      adminPhone, adminWhatsapp, adminOrganizerName, adminEventDate, adminPosition, adminIsFeatured, adminIsWeeklyPromo
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [
    adminTitleAr, adminTitleEn, adminDescAr, adminDescEn, adminPriceAr, adminPriceEn,
    adminCategory, adminSelectedStyles, adminMediaType, adminMediaUrl,
    adminLocationNameAr, adminLocationNameEn, adminAddressAr, adminAddressEn, adminGoogleMapsUrl,
    adminPhone, adminWhatsapp, adminOrganizerName, adminEventDate, adminPosition, adminIsFeatured, adminIsWeeklyPromo
  ]);
`;

code = code.replace(stateEndRegex, match => match + '\\n' + draftEffect);

// Clear draft on successful save
const saveSuccessRegex = /setAdminSaveStatus\('success'\);/;
const clearDraft = `setAdminSaveStatus('success');
      localStorage.removeItem(DRAFT_KEY);`;
code = code.replace(saveSuccessRegex, clearDraft);

fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
console.log('Added draft autosave');
