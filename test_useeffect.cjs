const fs = require('fs');

let content = fs.readFileSync('src/components/events/EventCard.tsx', 'utf8');

const target1 = `  const { lang, user, toggleEventLike, getBookingForEvent } = useApp();`;
const replace1 = `  const { lang, user, toggleEventLike, incrementEventView, getBookingForEvent } = useApp();
  
  React.useEffect(() => {
    incrementEventView(event.id);
  }, [event.id, incrementEventView]);`;

content = content.replace(target1, replace1);
fs.writeFileSync('src/components/events/EventCard.tsx', content);

let contentPromo = fs.readFileSync('src/components/events/WeeklyPromoBanner.tsx', 'utf8');
const target2 = `  const { lang, user, toggleEventLike } = useApp();`;
const replace2 = `  const { lang, user, toggleEventLike, incrementEventView } = useApp();
  
  React.useEffect(() => {
    incrementEventView(promoEvent.id);
  }, [promoEvent.id, incrementEventView]);`;

contentPromo = contentPromo.replace(target2, replace2);
fs.writeFileSync('src/components/events/WeeklyPromoBanner.tsx', contentPromo);
console.log('done effects');
