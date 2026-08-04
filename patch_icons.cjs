const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const imgUrl = 'https://res.cloudinary.com/dynasmcaj/image/upload/fbyjfjq8equle5pl7kwz.png';

content = content.replace(
  /<meta property="og:image" content="[^"]+" \/>/,
  `<meta property="og:image" content="${imgUrl}" />`
);

content = content.replace(
  /<meta name="twitter:image" content="[^"]+" \/>/,
  `<meta name="twitter:image" content="${imgUrl}" />`
);

content = content.replace(
  /<meta itemprop="image" content="[^"]+" \/>/,
  `<meta itemprop="image" content="${imgUrl}" />`
);

content = content.replace(
  /<link rel="icon"[^>]+>/,
  `<link rel="icon" type="image/png" href="${imgUrl}" />`
);

content = content.replace(
  /<link rel="apple-touch-icon"[^>]+>/,
  `<link rel="apple-touch-icon" href="${imgUrl}" />`
);

// Optional: Add Structured Data for Google to recognize the logo
const structuredData = `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "CityEve",
      "url": "https://cityeve.online/",
      "image": "${imgUrl}"
    }
    </script>
`;

if (!content.includes('application/ld+json')) {
  content = content.replace('</head>', structuredData + '  </head>');
}

fs.writeFileSync('index.html', content);
console.log('index.html updated with icons');
