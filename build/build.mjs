import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';

const services = await fs.readdir('services');
await fs.rm('out', { recursive: true, force: true });
await Promise.all(services.map(async s => {
    const source = path.resolve(`services/${s}/src`);
    const dest = path.resolve(`out/services/${s}`);
    await hoistDependencies(source, dest)
    await resolveModuleSymlinks(dest)
    await removeNestedNodeModules(dest)
}))

async function removeNestedNodeModules(source) {
    const modules = await discoverNodeModules(source);
    await Promise.all(modules.map(async ({ location }) => {
        const nodeModules = path.join(location, 'node_modules');
        if (!fsSync.existsSync(nodeModules))
            return;

        console.log(`Resolving nested node_modules ${nodeModules}`);
        await fs.rm(nodeModules, { recursive: true, force: true });
    }))
}

async function resolveModuleSymlinks(source) {
    const modules = await discoverNodeModules(source);
    await Promise.all(modules.map(async ({ location }) => {

        const stat = await fs.lstat(location);
        if (!stat.isSymbolicLink())
            return;

        console.log(`Resolving symlink ${location}`);

        const target = await fs.realpath(location);
        await fs.unlink(location);
        await fs.cp(target, location, { recursive: true });
    }));
}

async function hoistDependencies(source, dest) {
    await fs.cp(source, dest, { recursive: true });

    const rootModules = await discoverNodeModules(dest);
    const pending = rootModules.map(m => Promise.resolve(m.location));
    const modules = new Set(rootModules.map(v => v.name));
    const promises = [];
    let next
    while (next = pending.shift()) {
        for (const { name, location } of await discoverNodeModules(await next)) {
            if (modules.has(name))
                continue;

            console.log(`${dest}: Hoisting ${name}`);
            const hoisted = path.join(dest, 'node_modules', name);
            const copy = fs.cp(await fs.realpath(location), hoisted, { recursive: true });
            modules.add(name);
            pending.push(copy.then(() => hoisted));
            promises.push(copy);
        }
    }
    await Promise.all(promises);
    return rootModules;
}

/** @returns {Promise<Array<{ location: string; name: string; }>>} */
async function discoverNodeModules(dir) {
    const checkIn = path.join(dir, 'node_modules');
    if (!fsSync.existsSync(checkIn))
        return [];

    const results = [];
    for await (let entry of findDirectoriesWithPackageJson(checkIn)) {
        results.push(entry);
    }
    return results;
}

/** @returns {AsyncGenerator<{ location: string; name: string; }>} */
async function* findDirectoriesWithPackageJson(dir) {
    if (!fsSync.existsSync(dir))
        return;

    const stat = await fs.stat(dir);
    if (!stat.isDirectory())
        return;

    if (fsSync.existsSync(path.join(dir, 'package.json'))) {
        return yield {
            location: dir,
            name: dir.split('node_modules/').slice(-1)[0]
        };
    }

    for (const child of await fs.readdir(dir))
        yield* findDirectoriesWithPackageJson(path.join(dir, child));
}
