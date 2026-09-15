import fs from 'node:fs/promises';
import path from 'node:path';
import { describe } from 'node:test';

for await (const file of fs.glob(`${import.meta.dirname}/**/*.test.js`)) {
    if (file !== import.meta.filename) {
        await describe(path.relative(import.meta.dirname, file), () => import(file));
    }
}
