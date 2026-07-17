const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminEditEventPage.tsx', 'utf-8');

const target1 = `  const { lang, updateEvent, addNewEvent, editingEvent } = useApp();`;
const replace1 = `  const { lang, updateEvent, addNewEvent, editingEvent, events } = useApp();
  
  const currentDisplayIndex = editingEvent ? events.findIndex(e => e.id === editingEvent.id) + 1 : 0;
  const initialPosition = editingEvent?.position && editingEvent.position > 0 
    ? editingEvent.position 
    : currentDisplayIndex;`;

const target2 = `const [position, setPosition] = useState<number>(editingEvent?.position ?? 0);`;
const replace2 = `const [position, setPosition] = useState<number>(initialPosition);`;

const target3 = `    setPosition(editingEvent.position || 0);`;
const replace3 = `    setPosition(editingEvent.position && editingEvent.position > 0 ? editingEvent.position : currentDisplayIndex);`;

code = code.replace(target1, replace1);
code = code.replace(target2, replace2);
code = code.replace(target3, replace3);

fs.writeFileSync('src/components/admin/AdminEditEventPage.tsx', code);
