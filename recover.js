import fs from 'fs';

async function run() {
    try {
        const response = await fetch('http://localhost:3000/src/components/admin/AdminPanel.tsx');
        const text = await response.text();
        const match = text.match(/sourceMappingURL=data:application\/json;base64,(.*)$/);
        if (match && match[1]) {
            const base64Str = match[1];
            const jsonStr = Buffer.from(base64Str, 'base64').toString('utf8');
            const sourceMap = JSON.parse(jsonStr);
            if (sourceMap.sourcesContent && sourceMap.sourcesContent.length > 0) {
                fs.writeFileSync('AdminPanel_recovered.tsx', sourceMap.sourcesContent[0]);
                console.log('Successfully recovered AdminPanel.tsx to AdminPanel_recovered.tsx');
            }
        }
    } catch(e) {
        console.error(e);
    }
}
run();
