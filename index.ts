import childProcess from 'node:child_process';

if (isPnpEnabled()) {
    await import(`${import.meta.dirname}/src/master/start.js`);
} else {
    // eslint-disable-next-line no-console
    console.warn('PnP loader was not supplied at startup, spawning child process with the loader enabled.');
    const child = childProcess.spawn(process.argv[0], process.argv.slice(1), {
        cwd: process.cwd(),
        env: {
            ...process.env,
            'NODE_OPTIONS': `${process.env.NODE_OPTIONS ?? ''} --require ${import.meta.dirname}/.pnp.cjs --experimental-loader ${import.meta.dirname}/.pnp.loader.mjs`
        },
        stdio: 'inherit'
    });
    await new Promise(res => child.on('exit', res));
}

function isPnpEnabled(): boolean {
    try {
        import.meta.resolve('@blargbot/master');
        return true;
    } catch (error: unknown) {
        if (!(error instanceof Error))
            throw error;

        if (/Cannot find (?:package|module) '@blargbot\/master'/.test(error.message))
            return false;

        if (error.message.includes('Your application tried to access @blargbot/master, but it isn\'t declared in your dependencies; this makes the require call ambiguous and unsound.'))
            return true;

        throw error;
    }
}
