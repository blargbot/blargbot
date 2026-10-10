import type { DiscordUserCreatedDateLocals } from '@blargbot/bbtag-engine';
import { replacers, UserNotFoundError } from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

await runSubtagTests({
    replacer: replacers.userCreatedAtReplacer,
    names: ['userCreatedAt'],
    argCountBounds: { min: 0, max: 3 },
    cases: [
        {
            code: '{usercreatedat}',
            expected: '2021-01-01T00:00:00+00:00',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('', $({ quiet: true, throw: UserNotFoundError.withQuiet(true, '') }))).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.getTimestamp(userId)).returns(Date.UTC(2021, 0, 1)).mustHappen(1);
            }
        },
        ...createGetUserPropTestCases<DiscordUserCreatedDateLocals>({
            quiet: '',
            quietNoArgs: true,
            generateCode(...args) {
                return `{${['usercreatedat', '', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '2021-01-01T00:00:00+00:00',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getTimestamp(userId)).returns(Date.UTC(2021, 0, 1)).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases<DiscordUserCreatedDateLocals>({
            quiet: '',
            quietNoArgs: true,
            generateCode(...args) {
                return `{${['usercreatedat', 'DD/MM/YYYY', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '01/01/2021',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getTimestamp(userId)).returns(Date.UTC(2021, 0, 1)).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
