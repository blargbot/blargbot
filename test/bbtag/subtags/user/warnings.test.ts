import { WarningsSubtag } from '@blargbot/bbtag/subtags/user/warnings.js';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

runSubtagTests({
    subtag: new WarningsSubtag(),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases({
            quiet: undefined,
            generateCode(...args) {
                return `{${['warnings', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '0',
                    setup(member, ctx) {
                        ctx.guildTable.setup(m => m.getWarnings(ctx.guild.id, member.user.id)).thenResolve(undefined);
                    }
                },
                {
                    expected: '0',
                    setup(member, ctx) {
                        ctx.guildTable.setup(m => m.getWarnings(ctx.guild.id, member.user.id)).thenResolve(0);
                    }
                },
                {
                    expected: '1234',
                    setup(member, ctx) {
                        ctx.guildTable.setup(m => m.getWarnings(ctx.guild.id, member.user.id)).thenResolve(1234);
                    }
                }
            ]
        })
    ]
});
