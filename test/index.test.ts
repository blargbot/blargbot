import fs from 'node:fs/promises';
import path from 'node:path';
import { describe } from 'node:test';

for await (const tsFile of fs.glob(`${import.meta.dirname}/bbtag-engine/**/*.test.ts`)) {
    const jsFile = `${tsFile.slice(0, -3)}.js`;
    if (jsFile !== import.meta.filename) {
        await describe(path.relative(import.meta.dirname, jsFile), () => import(jsFile));
    }
}
