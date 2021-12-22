import { NotEnoughArgumentsError, TooManyArgumentsError, UserNotFoundError } from '@cluster/bbtag/errors';
import { UserSetNickSubtag } from '@cluster/subtags/user/usersetnick';
import { Member } from 'eris';

import { argument } from '../../../../mock';
import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new UserSetNickSubtag(),
    cases: [
        {
            code: '{usersetnick}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 13, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        {
            code: '{usersetnick;abc}',
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.editGuildMember(ctx.guild.id, ctx.users.command.id, argument.isDeepEqual({ nick: 'abc' }), 'Command User#0000'))
                    .verifiable(1)
                    .thenResolve();
            }
        },
        {
            code: '{usersetnick;abc;other user}',
            expected: '',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);
                member.setup(m => m.edit(argument.isDeepEqual({ nick: 'abc' }), 'Command User#0000'))
                    .verifiable(1)
                    .thenResolve();
            }
        },
        {
            code: '{usersetnick;abc;blargbot}',
            expected: '',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'blargbot'))
                    .verifiable(1)
                    .thenResolve([member.instance]);
                member.setup(m => m.edit(argument.isDeepEqual({ nick: 'abc' }), 'Command User#0000'))
                    .verifiable(1)
                    .thenResolve();
            }
        },
        {
            code: '{usersetnick;{eval};unknown user}',
            expected: '`No user found`',
            errors: [
                { start: 13, end: 19, error: new MarkerError('eval', 13) },
                { start: 0, end: 33, error: new UserNotFoundError('unknown user') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'unknown user'))
                    .verifiable(1)
                    .thenResolve([]);
            }
        },
        {
            code: '{usersetnick;{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 13, end: 19, error: new MarkerError('eval', 13) },
                { start: 20, end: 26, error: new MarkerError('eval', 20) },
                { start: 27, end: 33, error: new MarkerError('eval', 27) },
                { start: 0, end: 34, error: new TooManyArgumentsError(2, 3) }
            ]
        }
    ]
});
