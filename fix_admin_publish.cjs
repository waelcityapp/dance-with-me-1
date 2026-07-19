const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf8');

const replacement = `
      const coords = parseAdminCoordinates(adminGoogleMapsUrl || '');
      
      let maxRef = 1000;
      const assignedRefs = (events || []).map(e => e?.eventRef).filter((r): r is number => typeof r === 'number');
      if (assignedRefs.length > 0) {
        maxRef = Math.max(...assignedRefs);
      }
      const newEventRef = maxRef + 1;
      
      const newEventId = \`ev-adm-\${Date.now()}\`;

      // Safe date parsing
      let safeDateStr = new Date().toISOString();
      try {
        const d = new Date(adminEventDate);
        if (!isNaN(d.getTime())) {
          safeDateStr = d.toISOString();
        }
      } catch (e) { console.error(e); }

      const createdEvent: DanceEvent = {
        id: newEventId,
        titleAr: (adminTitleAr || '').trim(),
        titleEn: (adminTitleEn || '').trim(),
        descriptionAr: (adminDescAr || '').trim(),
        descriptionEn: (adminDescEn || '').trim(),
        category: adminCategory || 'party',
        styles: adminSelectedStyles || [],
        mediaType: adminMediaType || 'image',
        mediaUrl: finalMediaUrl,
        thumbnailUrl: finalThumbnailUrl,
        uploadDate: new Date().toISOString(),
        eventRef: newEventRef,
        eventDate: safeDateStr,
        priceAr: (adminPriceAr || '').trim() || '250 ج.م',
        priceEn: (adminPriceEn || '').trim() || '250 EGP',
        location: {
          nameAr: (adminLocationNameAr || '').trim() || 'أستوديو الرقص - الزمالك',
          nameEn: (adminLocationNameEn || '').trim() || 'Dance Studio - Zamalek',
          addressAr: (adminAddressAr || '').trim() || 'القاهرة، مصر',
          addressEn: (adminAddressEn || '').trim() || 'Cairo, Egypt',
          googleMapsUrl: (adminGoogleMapsUrl || '').trim(),
          lat: coords.lat,
          lng: coords.lng
        },
        contact: {
          phone: (adminPhone || '').trim() || '+201011223344',
          whatsapp: (adminWhatsapp || '').trim() || '201011223344',
          organizerName: (adminOrganizerName || '').trim() || 'الإدارة / Admin'
        },
        likesCount: 15,
        isFeatured: !!adminIsFeatured,
        isWeeklyPromo: !!adminIsWeeklyPromo,
        position: adminPosition ? Number(adminPosition) : 999999
      };
      
      // Save to Firestore and verify success
      const saveSuccess = await saveEventToFirestore(createdEvent);
      if (!saveSuccess) {
        throw new Error('Failed to save to Firestore');
      }
`;

// Replace the block from const coords to await saveEventToFirestore(createdEvent);
code = code.replace(/const coords = parseAdminCoordinates\([\s\S]*?await saveEventToFirestore\(createdEvent\);/, replacement);

fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
console.log('Fixed handleAdminPublish');
