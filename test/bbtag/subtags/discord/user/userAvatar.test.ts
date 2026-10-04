import type { DiscordUserAvatarLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

// TODO: Add tests for how default avatar urls are generated and the fallback from guild profiles to global profiles.

await runSubtagTests({
    replacer: replacers.userAvatarReplacer,
    names: ['userAvatar', 'userAvatar.global'],
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases<DiscordUserAvatarLocals>({
            quiet: '',
            quietNoArgs: true,
            generateCode(...args) {
                return `{${['useravatar', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'https://cdn.discordapp.com/avatars/12345678912345678/a1b2c3.png?size=512',
                    setup(ctx, userId) {
                        const url = new URL('https://cdn.discordapp.com/avatars/12345678912345678/a1b2c3.png?size=512');
                        ctx.discord.setup((m, $) => m.getAvatarUrl($({ userId, globalOnly: false }))).resolves(url).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases<DiscordUserAvatarLocals>({
            quiet: '',
            quietNoArgs: true,
            generateCode(...args) {
                return `{${['useravatar.global', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'https://cdn.discordapp.com/avatars/12345678912345678/a1b2c3.png?size=512',
                    setup(ctx, userId) {
                        const url = new URL('https://cdn.discordapp.com/avatars/12345678912345678/a1b2c3.png?size=512');
                        ctx.discord.setup((m, $) => m.getAvatarUrl($({ userId, globalOnly: true }))).resolves(url).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
