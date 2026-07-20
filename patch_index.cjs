const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

code = code.replace(
`    <title>Dance With Me | ارقص معي - أعلانات الحفلات والكورسات اللاتينية</title>
    
    <!-- PWA Defensive Cache-Busted Manifest & Icons -->`,
`    <title>Dance With Me | ارقص معي - أعلانات الحفلات والكورسات اللاتينية</title>
    
    <!-- SEO & Search Engine Optimization -->
    <meta name="description" content="Dance With Me - بوابة الفعاليات والحفلات والرحلات وكورسات الرقص اللاتيني (Salsa, Bachata, Kizomba) الفاخرة" />
    <meta name="keywords" content="salsa, bachata, kizomba, dance, egypt, cairo, parties, courses, رقص لاتيني, سالسا, باتشاتا, كيزومبا, حفلات رقص, كورسات رقص, مصر" />
    <meta name="author" content="Dance With Me" />
    <link rel="canonical" href="https://dance-with-me.web.app/" />

    <!-- Open Graph (Facebook, WhatsApp, LinkedIn) -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://dance-with-me.web.app/" />
    <meta property="og:title" content="Dance With Me | ارقص معي - الحفلات اللاتينية" />
    <meta property="og:description" content="منصتك الأولى لمعرفة وحجز أحدث الحفلات، الكورسات، ورحلات الرقص اللاتيني في مصر." />
    <meta property="og:image" content="https://dance-with-me.web.app/icon.svg" />
    <meta property="og:locale" content="ar_EG" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="https://dance-with-me.web.app/" />
    <meta name="twitter:title" content="Dance With Me | ارقص معي" />
    <meta name="twitter:description" content="بوابة الفعاليات والحفلات والرحلات وكورسات الرقص اللاتيني الفاخرة" />
    <meta name="twitter:image" content="https://dance-with-me.web.app/icon.svg" />

    <!-- PWA Defensive Cache-Busted Manifest & Icons -->`
);

// Remove the old meta description since we added it to the SEO section
code = code.replace(
`    <meta name="description" content="Dance With Me - بوابة الفعاليات والحفلات والرحلات وكورسات الرقص اللاتيني (Salsa, Bachata, Kizomba) الفاخرة" />
    
    <!-- Plyr Player Library for premium, direct video playback -->`,
`    <!-- Plyr Player Library for premium, direct video playback -->`
);

fs.writeFileSync('index.html', code);
