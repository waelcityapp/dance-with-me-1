const fs = require('fs');
let path = 'src/components/home/HomeFeed.tsx';
let content = fs.readFileSync(path, 'utf8');
const effectCode = `  // Scroll to specific event from URL if present
  useEffect(() => {
    if (activeEvents.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const eventId = urlParams.get('event');
      if (eventId) {
        // Expand visible count if needed to ensure the event is rendered
        const index = activeEvents.findIndex(ev => ev.id === eventId);
        if (index !== -1 && index >= visibleCount) {
           setVisibleCount(index + 5);
        }
        setTimeout(() => {
          const el = document.getElementById(\`event-\${eventId}\`);
          if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        }, 500);
      }
    }
  }, [activeEvents.length]);
`;

content = content.replace(
  '  // Back to Top scroll listener',
  effectCode + '\n  // Back to Top scroll listener'
);
fs.writeFileSync(path, content);
console.log('HomeFeed patched');
