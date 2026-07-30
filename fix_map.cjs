const fs = require('fs');

let content = fs.readFileSync('src/components/modals/MapModal.tsx', 'utf8');

const target = `  const mapEmbedUrl = \`https://maps.google.com/maps?q=\${loc.lat},\${loc.lng}&z=15&output=embed\`;`;

const replacement = `  const mapEmbedUrl = \`https://maps.google.com/maps?q=\${loc.lat},\${loc.lng}&z=15&output=embed\`;

  let finalMapUrl = loc.googleMapsUrl || \`https://maps.google.com/?q=\${loc.lat},\${loc.lng}\`;
  if (finalMapUrl && !finalMapUrl.startsWith('http')) {
    finalMapUrl = 'https://' + finalMapUrl;
  }`;

content = content.replace(target, replacement);

const targetHref = `href={loc.googleMapsUrl || \`https://maps.google.com/?q=\${loc.lat},\${loc.lng}\`}`;
const replacementHref = `href={finalMapUrl}`;

content = content.replace(targetHref, replacementHref);

fs.writeFileSync('src/components/modals/MapModal.tsx', content);
console.log('done');
