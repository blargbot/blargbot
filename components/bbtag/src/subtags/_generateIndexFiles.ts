import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { hostIfEntrypoint, ScriptHost } from '@blargbot/application';

@hostIfEntrypoint()
export class GenerateIndexFilesScript extends ScriptHost {
    public constructor() {
        super();
    }

    protected override async main(): Promise<void> {
        global.console.log('Creating index files');
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
            global.console.log('Creating index file for', fsi.name);
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

        global.console.log('Creating root index file');
        await fs.writeFile(path.join(dir, 'index.ts'), content);
    }
}
