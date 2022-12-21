import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

global.console.log('Creating index file');
const dir = path.dirname(fileURLToPath(import.meta.url));
const files = [] as string[];
for (const fsi of await fs.readdir(dir, { withFileTypes: true })) {
    if (!fsi.isDirectory())
        continue;

    for (const ifsi of await fs.readdir(path.join(dir, fsi.name), { withFileTypes: true })) {
        if (!ifsi.isFile() || ifsi.name.endsWith('index.ts') || !ifsi.name.endsWith('.ts'))
            continue;

        files.push(path.join(dir, fsi.name, `${ifsi.name.slice(0, -3)}.js`));
    }
}

const exports = files.map(f => `export * from './${path.relative(dir, f)}';`).join('\n');

global.console.log('Creating index file');
await fs.writeFile(path.join(dir, 'index.ts'), `${exports}\n`);
