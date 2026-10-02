import assert from 'node:assert/strict';

import { replacers } from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import { runSubtagTests } from '../../SubtagTestSuite.js';

const userIds = new Set(Array.from({ length: 10 }, () => random.bigint(10n ** 10n, 10n ** 20n)));

await runSubtagTests({
    replacer: replacers.randomUserReplacer,
    names: ['randomUser', 'randUser'],
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{randuser}',
            assert(_, result) {
                const expected = userIds.values().map(v => v.toString()).toArray();
                assert(expected.includes(result));
            },
            setup(ctx) {
                ctx.discord.setup(m => m.listAllMembers()).resolves(userIds).mustHappen(1);
            }
        }
    ]
});
