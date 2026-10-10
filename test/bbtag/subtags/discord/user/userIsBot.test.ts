import type { DiscordUserIsBotLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

await runSubtagTests({
    replacer: replacers.userIsBotReplacer,
    names: ['userIsBot', 'userBot'],
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases<DiscordUserIsBotLocals>({
            quiet: '',
            quietNoArgs: true,
            generateCode(...args) {
                return `{${['userisbot', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'true',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.isBot(userId)).resolves(true).mustHappen(1);
                    }
                },
                {
                    expected: 'false',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.isBot(userId)).resolves(false).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
