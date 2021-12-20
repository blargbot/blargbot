import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { WarningsSubtag } from '@cluster/subtags/user/warnings';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new WarningsSubtag(),
    cases: [
        ...createGetUserPropTestCases({
            ifQuietAndNotFound: undefined,
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
        }),
        {
            code: '{warnings;{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 10, end: 16, error: new MarkerError('eval', 10) },
                { start: 17, end: 23, error: new MarkerError('eval', 17) },
                { start: 24, end: 30, error: new MarkerError('eval', 24) },
                { start: 0, end: 31, error: new TooManyArgumentsError(2, 3) }
            ]
        }
    ]
});
