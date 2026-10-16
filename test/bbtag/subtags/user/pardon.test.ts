import { NotANumberError, UserNotFoundError } from '@blargbot/bbtag';
import type { PardonThunk } from '@blargbot/bbtag/subtags';
import { PardonSubtag } from '@blargbot/bbtag/subtags';
import { snowflake } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';
import * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

const pardon = new Mock<PardonThunk>({ id: 'pardon', callable: true });

await runSubtagTests({
    subtag: new PardonSubtag({
        pardon: pardon.instance
    }),
    argCountBounds: { min: 0, max: 3 },
    names: ['pardon'],
    setup(ctx) {
        ctx.adoptMock(pardon);
    },
    cases: [
        {
            code: '{pardon}',
            expected: '0',
            setup(ctx) {
                pardon.setup((m, $) => m($({ guildId: ctx.guild.id, targetId: ctx.users.command.id, moderatorId: ctx.users.command.id, count: 1, reason: 'Tag Pardon' })))
                    .mustHappen(1)
                    .resolves(0);
            }
        },
        {
            code: '{pardon}',
            expected: '5',
            setup(ctx) {
                pardon.setup((m, $) => m($({ guildId: ctx.guild.id, targetId: ctx.users.command.id, moderatorId: ctx.users.command.id, count: 1, reason: 'Tag Pardon' })))
                    .mustHappen(1)
                    .resolves(5);
            }
        },
        {
            code: '{pardon;}',
            expected: '3',
            setup(ctx) {
                pardon.setup((m, $) => m($({ guildId: ctx.guild.id, targetId: ctx.users.command.id, moderatorId: ctx.users.command.id, count: 1, reason: 'Tag Pardon' })))
                    .mustHappen(1)
                    .resolves(3);
            }
        },
        {
            code: '{pardon;other user}',
            expected: '7',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const memberId = snowflake.create().toString();
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);
                member.setup(m => m.id).returns(memberId);

                pardon.setup((m, $) => m($({ guildId: ctx.guild.id, targetId: memberId, moderatorId: ctx.users.command.id, count: 1, reason: 'Tag Pardon' })))
                    .mustHappen(1)
                    .resolves(7);
            }
        },
        {
            code: '{pardon;;6}',
            expected: '26',
            setup(ctx) {
                pardon.setup((m, $) => m($({ guildId: ctx.guild.id, targetId: ctx.users.command.id, moderatorId: ctx.users.command.id, count: 6, reason: 'Tag Pardon' })))
                    .mustHappen(1)
                    .resolves(26);
            }
        },
        {
            code: '{pardon;other user;9}',
            expected: '0',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const memberId = snowflake.create().toString();
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);
                member.setup(m => m.id).returns(memberId);

                pardon.setup((m, $) => m($({ guildId: ctx.guild.id, targetId: memberId, moderatorId: ctx.users.command.id, count: 9, reason: 'Tag Pardon' })))
                    .mustHappen(1)
                    .resolves(0);
            }
        },
        {
            code: '{pardon;;;My custom reason}',
            expected: '16',
            setup(ctx) {
                pardon.setup((m, $) => m($({ guildId: ctx.guild.id, targetId: ctx.users.command.id, moderatorId: ctx.users.command.id, count: 1, reason: 'My custom reason' })))
                    .mustHappen(1)
                    .resolves(16);
            }
        },
        {
            code: '{pardon;other user;6;My custom reason}',
            expected: '6',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const memberId = snowflake.create().toString();
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);
                member.setup(m => m.id).returns(memberId);

                pardon.setup((m, $) => m($({ guildId: ctx.guild.id, targetId: memberId, moderatorId: ctx.users.command.id, count: 6, reason: 'My custom reason' })))
                    .mustHappen(1)
                    .resolves(6);
            }
        },
        {
            code: '{pardon;unknown user}',
            expected: '`No user found`',
            errors: [
                { error: new UserNotFoundError('unknown user') }
            ],
            setup(ctx) {
                ctx.util.setup((m, $) => m.findMembers($.allOf($.instanceOf(eris.Guild), $.looksLikeLoose({ id: ctx.guild.id })), 'unknown user'))
                    .mustHappen(1)
                    .resolves([]);
            }
        },
        {
            code: '{pardon;other user;abc}',
            expected: '`Not a number`',
            errors: [
                { error: new NotANumberError('abc') }
            ],
            setup(ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                ctx.util.setup((m, $) => m.findMembers($.allOf($.instanceOf(eris.Guild), $.looksLikeLoose({ id: ctx.guild.id })), 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);
            }
        }
    ]
});
