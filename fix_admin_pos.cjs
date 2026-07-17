const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf-8');

const target1 = `  const [adminPosition, setAdminPosition] = useState<number>(1);`;
const replace1 = `  const [adminPosition, setAdminPosition] = useState<number>(1);
  const [hasAutoSetPosition, setHasAutoSetPosition] = useState(false);

  useEffect(() => {
    if (!hasAutoSetPosition && events.length > 0) {
      const maxPos = events.reduce((max, ev) => {
        const p = ev.position;
        if (typeof p === 'number' && p !== 999999) {
          return p > max ? p : max;
        }
        return max;
      }, 0);
      setAdminPosition(maxPos + 1);
      setHasAutoSetPosition(true);
    }
  }, [events, hasAutoSetPosition]);`;

code = code.replace(target1, replace1);
fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
