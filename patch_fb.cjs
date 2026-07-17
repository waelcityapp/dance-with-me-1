const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf-8');

const target = `          const hasImage = isValidMediaUrl(ev.mediaUrl) || isValidMediaUrl(ev.thumbnailUrl);
          if (!hasImage) {
            console.warn('Skipping event without image:', ev.id, ev.titleAr);
            return;
          }`;

const replace = `          // We no longer skip events without images at the DB level, 
          // because we need empty ads (deleted slots) to maintain position numbers in the admin panel.
          // The frontend (AppContext activeEvents) will filter out incomplete events for normal users.
          const hasImage = isValidMediaUrl(ev.mediaUrl) || isValidMediaUrl(ev.thumbnailUrl);
          if (!hasImage && !ev.isEmpty) {
            console.warn('Event has no image and is not empty:', ev.id, ev.titleAr);
            // Optionally we could still skip, but it's better to let AdminPanel see it and let activeEvents filter it out.
          }`;

code = code.replace(target, replace);
fs.writeFileSync('src/lib/firebase.ts', code);
