const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminEditEventPage.tsx', 'utf-8');

const targetEffect = `  useEffect(() => {
    if (!editingEvent) {
      onCancel();
    }
  }, [editingEvent, onCancel]);`;

const replacementEffect = `  useEffect(() => {
    if (!editingEvent) {
      onCancel();
      return;
    }
    setTitleAr(editingEvent.titleAr || '');
    setTitleEn(editingEvent.titleEn || '');
    setDescAr(editingEvent.descriptionAr || '');
    setDescEn(editingEvent.descriptionEn || '');
    setCategory(editingEvent.category || 'party');
    setMediaType(editingEvent.mediaType || 'image');
    setMediaUrl(editingEvent.mediaUrl || '');
    try {
      if (editingEvent.eventDate) {
        setEventDate(new Date(editingEvent.eventDate).toISOString().split('T')[0]);
      } else {
        setEventDate('');
      }
    } catch(e) {
      setEventDate('');
    }
    setPriceAr(editingEvent.priceAr || '');
    setPriceEn(editingEvent.priceEn || '');
    setOrganizerName(editingEvent.contact?.organizerName || '');
    setPhone(editingEvent.contact?.phone || '');
    setWhatsapp(editingEvent.contact?.whatsapp || '');
    setLocationNameAr(editingEvent.location?.nameAr || '');
    setLocationNameEn(editingEvent.location?.nameEn || '');
    setAddressAr(editingEvent.location?.addressAr || '');
    setAddressEn(editingEvent.location?.addressEn || '');
    setGoogleMapsUrl(editingEvent.location?.googleMapsUrl || '');
    setSelectedStyles(editingEvent.styles || []);
    setPosition(editingEvent.position || 0);
    setAdNumber(editingEvent.adNumber || '');
    setAdType(editingEvent.adType || 'standard');
    setIsFeatured(editingEvent.isFeatured || false);
  }, [editingEvent, onCancel]);`;

code = code.replace(targetEffect, replacementEffect);
fs.writeFileSync('src/components/admin/AdminEditEventPage.tsx', code);
