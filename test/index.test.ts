import fs from 'node:fs/promises';

for await (const file of fs.glob(`${import.meta.dirname}/**/*.js`)) {
    if (file !== import.meta.filename)
        await import(file);
}
