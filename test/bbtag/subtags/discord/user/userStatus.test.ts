import type { DiscordUserStatusLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

await runSubtagTests({
    replacer: replacers.userStatusReplacer,
    names: ['userStatus'],
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases<DiscordUserStatusLocals>({
            quiet: '',
            quietNoArgs: true,
            generateCode(...args) {
                return `{${['userstatus', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'dnd',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getStatus(userId)).resolves('dnd').mustHappen(1);
                    }
                },
                {
                    expected: 'idle',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getStatus(userId)).resolves('idle').mustHappen(1);
                    }
                },
                {
                    expected: 'offline',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getStatus(userId)).resolves('offline').mustHappen(1);
                    }
                },
                {
                    expected: 'online',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getStatus(userId)).resolves('online').mustHappen(1);
                    }
                }
            ]
        })
    ]
});
