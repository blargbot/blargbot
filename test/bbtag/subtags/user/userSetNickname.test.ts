import { UserNotFoundError } from '@blargbot/bbtag';
import { UserSetNickSubtag } from '@blargbot/bbtag/subtags';
import type * as eris from 'eris';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new UserSetNickSubtag(),
    argCountBounds: { min: 1, max: 2 },
    names: ['userSetNickname', 'setNickname', 'setNick', 'userSetNick'],
    cases: [
        {
            code: '{usersetnick;abc}',
            expected: '',
            setup(ctx) {
                ctx.discord.setup((m, $) => m.editGuildMember(ctx.guild.id, ctx.users.command.id, $({ nick: 'abc' }), 'Command User#0000'))
                    .mustHappen(1)
                    .resolves(null!);
            }
        },
        {
            code: '{usersetnick;abc;other user}',
            expected: '',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>();
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);
                member.setup((m, $) => m.edit($({ nick: 'abc' }), 'Command User#0000'))
                    .mustHappen(1)
                    .resolves();
                member.setupSet(m => m.nick = 'abc').returns(true).mustHappen(1);
            }
        },
        {
            code: '{usersetnick;abc;blargbot}',
            expected: '',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>();
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'blargbot'))
                    .mustHappen(1)
                    .resolves([member.instance]);
                member.setup((m, $) => m.edit($({ nick: 'abc' }), 'Command User#0000'))
                    .mustHappen(1)
                    .resolves();
                member.setupSet(m => m.nick = 'abc').returns(true).mustHappen(1);
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
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'unknown user'))
                    .mustHappen(1)
                    .resolves([]);
            }
        }
    ]
});
