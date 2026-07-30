const fs = require('fs');
let content = fs.readFileSync('src/components/admin/AdminEditEventPage.tsx', 'utf8');

const target = `        mediaUrl,
        styles: selectedStyles,`;

const newCode = `        mediaUrl,
        thumbnailUrl: mediaType === 'video' ? (mediaUrl.includes('cloudinary.com') ? mediaUrl.replace(/\\.[^.]+$/, '.jpg') : mediaUrl) : mediaUrl,
        styles: selectedStyles,`;

content = content.replace(target, newCode);
fs.writeFileSync('src/components/admin/AdminEditEventPage.tsx', content);

console.log('done fixing thumbnail');
