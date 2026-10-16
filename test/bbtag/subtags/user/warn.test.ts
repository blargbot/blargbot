import { NotANumberError, UserNotFoundError } from '@blargbot/bbtag';
import type { WarnThunk } from '@blargbot/bbtag/subtags';
import { WarnSubtag } from '@blargbot/bbtag/subtags';
import { snowflake } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';
import * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

const warn = new Mock<WarnThunk>({ id: 'warn', callable: true });

await runSubtagTests({
    subtag: new WarnSubtag({
        warn: warn.instance
    }),
    argCountBounds: { min: 0, max: 3 },
    names: ['warn'],
    setup(ctx) {
        ctx.adoptMock(warn);
    },
    cases: [
        {
            code: '{warn}',
            expected: '1',
            setup(ctx) {
                warn.setup((m, $) => m($({ guildId: ctx.guild.id, targetId: ctx.users.command.id, moderatorId: ctx.users.command.id, count: 1, reason: 'Tag Warning' })))
                    .mustHappen(1)
                    .resolves(1);
            }
        },
        {
            code: '{warn}',
            expected: '7',
            setup(ctx) {
                warn.setup((m, $) => m($({ guildId: ctx.guild.id, targetId: ctx.users.command.id, moderatorId: ctx.users.command.id, count: 1, reason: 'Tag Warning' })))
                    .mustHappen(1)
                    .resolves(7);
            }
        },
        {
            code: '{warn;}',
            expected: '2',
            setup(ctx) {
                warn.setup((m, $) => m($({ guildId: ctx.guild.id, targetId: ctx.users.command.id, moderatorId: ctx.users.command.id, count: 1, reason: 'Tag Warning' })))
                    .mustHappen(1)
                    .resolves(2);
            }
        },
        {
            code: '{warn;other user}',
            expected: '5',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const memberId = snowflake.create().toString();
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);
                member.setup(m => m.id).returns(memberId);

                warn.setup((m, $) => m($({ guildId: ctx.guild.id, targetId: memberId, moderatorId: ctx.users.command.id, count: 1, reason: 'Tag Warning' })))
                    .mustHappen(1)
                    .resolves(5);
            }
        },
        {
            code: '{warn;;6}',
            expected: '29',
            setup(ctx) {
                warn.setup((m, $) => m($({ guildId: ctx.guild.id, targetId: ctx.users.command.id, moderatorId: ctx.users.command.id, count: 6, reason: 'Tag Warning' })))
                    .mustHappen(1)
                    .resolves(29);
            }
        },
        {
            code: '{warn;other user;9}',
            expected: '9',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const memberId = snowflake.create().toString();
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);
                member.setup(m => m.id).returns(memberId);

                warn.setup((m, $) => m($({ guildId: ctx.guild.id, targetId: memberId, moderatorId: ctx.users.command.id, count: 9, reason: 'Tag Warning' })))
                    .mustHappen(1)
                    .resolves(9);
            }
        },
        {
            code: '{warn;;;My custom reason}',
            expected: '16',
            setup(ctx) {
                warn.setup((m, $) => m($({ guildId: ctx.guild.id, targetId: ctx.users.command.id, moderatorId: ctx.users.command.id, count: 1, reason: 'My custom reason' })))
                    .mustHappen(1)
                    .resolves(16);
            }
        },
        {
            code: '{warn;other user;6;My custom reason}',
            expected: '22',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const memberId = snowflake.create().toString();
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);
                member.setup(m => m.id).returns(memberId);

                warn.setup((m, $) => m($({ guildId: ctx.guild.id, targetId: memberId, moderatorId: ctx.users.command.id, count: 6, reason: 'My custom reason' })))
                    .mustHappen(1)
                    .resolves(22);
            }
        },
        {
            code: '{warn;unknown user}',
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
            code: '{warn;other user;abc}',
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
