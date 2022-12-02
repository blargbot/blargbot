import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (`file://${process.argv[1]}` !== import.meta.url)
    throw new Error('Cannot require() this file');

const dir = path.dirname(fileURLToPath(import.meta.url));
const dirs = [] as string[];
for (const fsi of await fs.readdir(dir, { withFileTypes: true })) {
    if (!fsi.isDirectory())
        continue;

    dirs.push(fsi.name);
    const files = [] as string[];
    for (const ifsi of await fs.readdir(path.join(dir, fsi.name), { withFileTypes: true })) {
        if (!ifsi.isFile() || ifsi.name.endsWith('index.ts') || !ifsi.name.endsWith('.ts'))
            continue;
        files.push(ifsi.name.slice(0, -3));
    }
    const content = `${files.map(f => `export * from './${f}.js';`).join('\n')}\n`;
    await fs.writeFile(path.join(dir, fsi.name, './index.ts'), content, {});
}

const imports = dirs.map(d => `import * as ${d} from './${d}/index.js';`).join('\n');
const content = `${imports}

export {
${dirs.map(d => `    ${d}`).join(',\n')}
};

export const all = {
${dirs.map(d => `    ...${d}`).join(',\n')}
};

export default all;
`;

await fs.writeFile(path.join(dir, 'index.ts'), content);
