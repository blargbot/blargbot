import fs from 'node:fs/promises';

if (import.meta.main)
    throw new Error('Cannot require() this file');

void (async function () {
    const dirs = [] as string[];
    for (const fsi of await fs.readdir(import.meta.dirname, { withFileTypes: true })) {
        if (!fsi.isDirectory())
            continue;

        dirs.push(fsi.name);
        const files = [] as string[];
        for (const ifsi of await fs.readdir(`${import.meta.dirname}/${fsi.name}`, { withFileTypes: true })) {
            if (!ifsi.isFile() || ifsi.name.endsWith('index.ts') || !ifsi.name.endsWith('.ts'))
                continue;
            files.push(ifsi.name.slice(0, -3));
        }
        const content = `${files.map(f => `export * from './${f}.js';`).join('\n')}\n`;
        await fs.writeFile(`${import.meta.dirname}/${fsi.name}/index.ts`, content, {});
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
    await fs.writeFile(`${import.meta.dirname}/index.ts`, content);
})();
