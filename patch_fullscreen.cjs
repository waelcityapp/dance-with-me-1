const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPanel.tsx', 'utf-8');

code = code.replace(
  "const [adminEditValue, setAdminEditValue] = useState('');",
  "const [adminEditValue, setAdminEditValue] = useState('');\n  const [isFullscreenEvents, setIsFullscreenEvents] = useState(false);"
);

const fullscreenBtn = `              <div className="flex justify-end px-2 mb-2 gap-2">
                <button
                  onClick={() => setIsFullscreenEvents(true)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Maximize2 className="h-3 w-3" />
                  {lang === 'ar' ? 'تكبير القائمة' : 'Expand List'}
                </button>
                <button`;

code = code.replace(
  `<div className="flex justify-end px-2 mb-2">\n                <button`,
  fullscreenBtn
);

const maximizeImport = `import { Maximize2, Minimize2 } from 'lucide-react';`;
if (!code.includes('Maximize2')) {
  code = code.replace(`import { `, `import { Maximize2, Minimize2, `);
}


fs.writeFileSync('src/components/admin/AdminPanel.tsx', code);
