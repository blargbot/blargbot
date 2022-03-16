import { env } from 'process';

import { setup } from './.pnp.cjs';

try {
    require.resolve('@blargbot/master');
} catch (err: unknown) {
    if (!(err instanceof Error) || !err.message.startsWith('Cannot find module \'@blargbot/master\'\nRequire stack:'))
        throw err;
    setup();
    const nodeEnv = env['NODE_OPTIONS'] ?? '';
    const pnp = require.resolve('./.pnp.cjs');
    env['NODE_OPTIONS'] = `${nodeEnv} --require ${pnp}`;
}
