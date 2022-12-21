import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const files = [] as string[];
global.console.log('Finding subtag files');
for (const groupDir of await fs.readdir(dir, { withFileTypes: true }))
    if (groupDir.isDirectory())
        for (const file of await fs.readdir(path.join(dir, groupDir.name), { withFileTypes: true }))
            if (file.isFile() && file.name.endsWith('.ts'))
                files.push(path.join(dir, groupDir.name, `${file.name.slice(0, -3)}.js`));
global.console.log(`Found ${files.length} subtag files`);

global.console.log('Creating index file');
const exports = files.map(f => `export * from './${path.relative(dir, f)}';`).join('\n');
await fs.writeFile(path.join(dir, 'index.ts'), `${exports}\n`);
global.console.log('Created index file');
