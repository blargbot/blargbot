import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const thisFile = fileURLToPath(import.meta.url);
const thisDir = path.dirname(thisFile);
const require = createRequire(import.meta.url);

if (require.main !== module)
    throw new Error('Cannot require() this file');

void (async function () {
    const dirs = [] as string[];
    for (const fsi of await fs.readdir(thisDir, { withFileTypes: true })) {
        if (!fsi.isDirectory())
            continue;

        dirs.push(fsi.name);
        const files = [] as string[];
        for (const ifsi of await fs.readdir(path.join(thisDir, fsi.name), { withFileTypes: true })) {
            if (!ifsi.isFile() || ifsi.name.endsWith('index.ts') || !ifsi.name.endsWith('.ts'))
                continue;
            files.push(ifsi.name.slice(0, -3));
        }
        const content = `${files.map(f => `export * from './${f}.js';`).join('\n')}\n`;
        await fs.writeFile(path.join(thisDir, fsi.name, './index.ts'), content, {});
    }

    const imports = dirs.map(d => `import * as ${d} from './${d}.js';`).join('\n');
    const content = `${imports}

export {
${dirs.map(d => `    ${d}`).join(',\n')}
};

export const all = {
${dirs.map(d => `    ...${d}`).join(',\n')}
};

export default all;
`;
    await fs.writeFile(path.join(thisDir, 'index.ts'), content);
})();
