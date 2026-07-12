const fs = require('fs');
const { execSync } = require('child_process');

try {
    const output = execSync('curl -s http://localhost:3000/src/components/admin/AdminPanel.tsx').toString();
    const match = output.match(/sourceMappingURL=data:application\/json;base64,(.*)$/);
    if (match && match[1]) {
        const base64Str = match[1];
        const jsonStr = Buffer.from(base64Str, 'base64').toString('utf8');
        const sourceMap = JSON.parse(jsonStr);
        if (sourceMap.sourcesContent && sourceMap.sourcesContent.length > 0) {
            fs.writeFileSync('AdminPanel_recovered.tsx', sourceMap.sourcesContent[0]);
            console.log('Successfully recovered AdminPanel.tsx to AdminPanel_recovered.tsx');
        } else {
            console.log('No sourcesContent in sourcemap');
        }
    } else {
        console.log('No inline sourcemap found');
    }
} catch (e) {
    console.error(e);
}
