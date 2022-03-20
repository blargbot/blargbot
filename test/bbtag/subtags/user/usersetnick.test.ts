import { UserNotFoundError } from '@blargbot/bbtag/errors';
import { UserSetNickSubtag } from '@blargbot/bbtag/subtags/user/usersetnick';
import { Member } from 'eris';

import { argument } from '../../mock';
import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new UserSetNickSubtag(),
    argCountBounds: { min: 1, max: 2 },
    cases: [
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
        }
    ]
});
