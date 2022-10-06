import { env } from 'process';

import { setup } from './.pnp.cjs';

try {
    require.resolve(`@blargbot/master`);
} catch (err: unknown) {
    if (!(err instanceof Error))
        throw err;

    switch (err.message.split(`\n`)[0]) {
        case `Cannot find module '@blargbot/master'`: {
            setup();
            const nodeEnv = env[`NODE_OPTIONS`] ?? ``;
            const pnp = require.resolve(`./.pnp.cjs`);
            env[`NODE_OPTIONS`] = `${nodeEnv} --require ${pnp}`;
            break;
        }
        case `Your application tried to access @blargbot/master, but it isn't declared in your dependencies; this makes the require call ambiguous and unsound.`:
            break;
        default:
            throw err;
    }
}
