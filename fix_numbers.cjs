const fs = require('fs');

// Fix WeeklyPromoBanner
let banner = fs.readFileSync('src/components/events/WeeklyPromoBanner.tsx', 'utf-8');
banner = banner.replace(
  />\s*#1\s*<\/span>/g,
  `>              #{promoEvent.position && promoEvent.position !== 999999 ? promoEvent.position : '-'}            </span>`
);
banner = banner.replace(
  />\s*#1\s*<\/div>/g,
  `>            #{promoEvent.position && promoEvent.position !== 999999 ? promoEvent.position : '-'}          </div>`
);
fs.writeFileSync('src/components/events/WeeklyPromoBanner.tsx', banner);

// Fix EventCard
let card = fs.readFileSync('src/components/events/EventCard.tsx', 'utf-8');
card = card.replace(
  />\s*#\{index !== undefined \? index \+ 1 : '-'\}\s*<\/span>/g,
  `>              #{event.position && event.position !== 999999 && event.position > 0 ? event.position : (index !== undefined ? index + 1 : '-')}            </span>`
);
card = card.replace(
  />\s*#\{index !== undefined \? index \+ 1 : '-'\}\s*<\/div>/g,
  `>              #{event.position && event.position !== 999999 && event.position > 0 ? event.position : (index !== undefined ? index + 1 : '-')}            </div>`
);
fs.writeFileSync('src/components/events/EventCard.tsx', card);

