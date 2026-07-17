const fs = require('fs');
let code = fs.readFileSync('src/components/events/EventCard.tsx', 'utf-8');

const target1 = `#{event.position && event.position !== 999999 && event.position > 0 ? event.position : (index !== undefined ? index + 1 : '-')}`;
const replace1 = `#{index !== undefined ? index + 1 : ''}
              {event.position !== undefined && event.position !== 999999 && event.position !== 0 && (
                <span className="text-[10px] text-neutral-400 font-bold ml-1">
                  ({event.position})
                </span>
              )}
              {index === undefined && (event.position === undefined || event.position === 999999 || event.position === 0) && '-'}`;

code = code.replace(target1, replace1);

const target2 = `#{event.position && event.position !== 999999 && event.position > 0 ? event.position : (index !== undefined ? index + 1 : '-')}`;
const replace2 = `#{index !== undefined ? index + 1 : ''}
              {event.position !== undefined && event.position !== 999999 && event.position !== 0 && (
                <span className="text-[10px] text-neutral-400 font-bold ml-1">
                  ({event.position})
                </span>
              )}
              {index === undefined && (event.position === undefined || event.position === 999999 || event.position === 0) && '-'}`;

code = code.replace(target2, replace2);

fs.writeFileSync('src/components/events/EventCard.tsx', code);
