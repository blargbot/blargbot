import type { GuildMemberRolesLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

await runSubtagTests({
    replacer: replacers.userRolesReplacer,
    names: ['userRoles'],
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases<GuildMemberRolesLocals>({
            quiet: '',
            quietNoArgs: true,
            generateCode(...args) {
                return `{${['userroles', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '[]',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.listUserRoles(userId)).resolves([]).mustHappen(1);
                    }
                },
                {
                    expected: '["98765434512212678"]',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.listUserRoles(userId)).resolves([98765434512212678n]).mustHappen(1);
                    }
                },
                {
                    expected: '["98765434512212678","1234567890987654"]',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.listUserRoles(userId)).resolves([98765434512212678n, 1234567890987654n]).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
