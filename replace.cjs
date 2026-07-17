const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminEditEventPage.tsx', 'utf-8');

const target = `      const updatedEvent = {
        ...editingEvent,
        titleAr,
        titleEn,
        descriptionAr: descAr,
        descriptionEn: descEn,
        category,
        mediaType,
        mediaUrl,
        styles: selectedStyles,
        priceAr,
        priceEn,
        eventDate: eventDate ? new Date(eventDate).toISOString() : editingEvent.eventDate,
        location: {
          nameAr: locationNameAr,
          nameEn: locationNameEn,
          addressAr,
          addressEn,
          googleMapsUrl
        },
        contact: {
          organizerName,
          phone,
          whatsapp
        },
        position: Number(position) || 0,
        adNumber,
        adType,
        isFeatured
      };

      updateEvent(updatedEvent);
      await saveEventToFirestore(updatedEvent);
      
      // Delete old media from Cloudinary if the URL changed and it was a Cloudinary URL
      if (editingEvent.mediaUrl !== mediaUrl && editingEvent.mediaUrl.includes('cloudinary.com')) {
        await deleteFromCloudinary(editingEvent.mediaUrl, editingEvent.mediaType);
      }`;

const replacement = `      const newPos = Number(position) || 0;
      const isPositionChanged = newPos !== (editingEvent.position || 0);

      const baseUpdatedData = {
        ...editingEvent,
        titleAr,
        titleEn,
        descriptionAr: descAr,
        descriptionEn: descEn,
        category,
        mediaType,
        mediaUrl,
        styles: selectedStyles,
        priceAr,
        priceEn,
        eventDate: eventDate ? new Date(eventDate).toISOString() : editingEvent.eventDate,
        location: {
          nameAr: locationNameAr,
          nameEn: locationNameEn,
          addressAr,
          addressEn,
          googleMapsUrl
        },
        contact: {
          organizerName,
          phone,
          whatsapp
        },
        position: newPos,
        adNumber,
        adType,
        isFeatured
      };

      if (isPositionChanged) {
        // Create a copy with a new ID
        const newEventId = \`ev_\${adType}_\${Date.now()}\`;
        const newEvent = {
          ...baseUpdatedData,
          id: newEventId,
          uploadDate: new Date().toISOString()
        };
        
        addNewEvent(newEvent);
        // Save to Firestore but DO NOT delete original media since it might still be used by the original event
      } else {
        // Just update existing
        updateEvent(baseUpdatedData);
        await saveEventToFirestore(baseUpdatedData);
        
        // Delete old media from Cloudinary if the URL changed and it was a Cloudinary URL
        if (editingEvent.mediaUrl !== mediaUrl && editingEvent.mediaUrl.includes('cloudinary.com')) {
          await deleteFromCloudinary(editingEvent.mediaUrl, editingEvent.mediaType);
        }
      }`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/admin/AdminEditEventPage.tsx', code);
