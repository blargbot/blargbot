import fs from 'fs/promises';
import path from 'path';

if (require.main !== module)
    throw new Error(`Cannot require() this file`);

void (async function () {
    const dirs = [] as string[];
    for (const fsi of await fs.readdir(__dirname, { withFileTypes: true })) {
        if (!fsi.isDirectory())
            continue;

        dirs.push(fsi.name);
        const files = [] as string[];
        for (const ifsi of await fs.readdir(path.join(__dirname, fsi.name), { withFileTypes: true })) {
            if (!ifsi.isFile() || ifsi.name.endsWith(`index.ts`) || !ifsi.name.endsWith(`.ts`))
                continue;
            files.push(ifsi.name.slice(0, -3));
        }
        const content = `${files.map(f => `export * from './${f}';`).join(`\n`)  }\n`;
        await fs.writeFile(path.join(__dirname, fsi.name, `./index.ts`), content, {});
    }

    const imports = dirs.map(d => `import * as ${d} from './${d}';`).join(`\n`);
    const content = `${imports}

export {
${dirs.map(d => `    ${d}`).join(`,\n`)}
};

export const all = {
${dirs.map(d => `    ...${d}`).join(`,\n`)}
};

export default all;
`;
    await fs.writeFile(path.join(__dirname, `index.ts`), content);
})();
