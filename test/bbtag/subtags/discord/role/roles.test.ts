import type { GuildRolesLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetUserPropTestCases } from '../user/_getUserPropTest.js';

await runSubtagTests({
    replacer: replacers.rolesReplacer,
    names: ['roles'],
    argCountBounds: { min: 0, max: 2 },
    cases: [
        {
            code: '{roles}',
            expected: '["2938476294246234","394085735375349786","394085735375349785","340987563405745430","394850730479533405","923874043782332894732"]',
            setup(ctx) {
                ctx.discord.setup(m => m.listAllRoles()).resolves([
                    2938476294246234n,
                    394085735375349786n,
                    394085735375349785n,
                    340987563405745430n,
                    394850730479533405n,
                    923874043782332894732n
                ]).mustHappen(1);
            }
        },
        ...createGetUserPropTestCases<GuildRolesLocals>({
            quiet: '',
            includeNoArgs: false,
            generateCode(...args) {
                return `{${['roles', ...args].join(';')}}`;
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
