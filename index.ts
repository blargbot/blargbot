import childProcess from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (await isPnpEnabled()) {
    await import('./src/master/start.js');
} else {
    // eslint-disable-next-line no-console
    console.warn('PnP loader was not supplied at startup, spawning child process with the loader enabled.');
    const thisFile = fileURLToPath(import.meta.url);
    const thisDir = path.dirname(thisFile);
    const child = childProcess.spawn(process.argv[0], process.argv.slice(1), {
        cwd: process.cwd(),
        env: {
            ...process.env,
            'NODE_OPTIONS': `${process.env.NODE_OPTIONS ?? ''} --require ${thisDir}/.pnp.cjs --experimental-loader ${thisDir}/.pnp.loader.mjs`
        },
        stdio: 'inherit'
    });
    await new Promise(res => child.on('exit', res));
}

async function isPnpEnabled(): Promise<boolean> {
    let resolve = import.meta.resolve?.bind(import.meta);
    if (resolve === undefined) {
        const require = createRequire(import.meta.url);
        resolve = identifier => Promise.resolve(require.resolve(identifier));
    }

    try {
        await resolve('@blargbot/master');
        return true;
    } catch (error: unknown) {
        if (!(error instanceof Error))
            throw error;

        if (error.message.includes('Cannot find module \'@blargbot/master\''))
            return false;

        if (error.message.includes('Your application tried to access @blargbot/master, but it isn\'t declared in your dependencies; this makes the require call ambiguous and unsound.'))
            return true;

        throw error;
    }
}
