import { replacers, UserNotFoundError } from '@blargbot/bbtag-engine';
import { $ } from '@blargbot/test-util/mock.js';
import * as eris from 'eris';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.userSetNickReplacer,
    argCountBounds: { min: 1, max: 2 },
    cases: [
        {
            code: '{usersetnick;abc}',
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.editGuildMember(ctx.guild.id, ctx.users.command.id, $.looksLike({ nick: 'abc' }), 'Command User#0000'))
                    .verifiable(1)
                    .thenResolve();
            }
        },
        {
            code: '{usersetnick;abc;other user}',
            expected: '',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(eris.Member);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);
                member.setup(m => m.edit($.looksLike({ nick: 'abc' }), 'Command User#0000'))
                    .mustHappen(1)
                    .resolves();
            }
        },
        {
            code: '{usersetnick;abc;blargbot}',
            expected: '',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(eris.Member);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'blargbot'))
                    .verifiable(1)
                    .thenResolve([member.instance]);
                member.setup(m => m.edit($.looksLike({ nick: 'abc' }), 'Command User#0000'))
                    .mustHappen(1)
                    .resolves();
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
