import { NotANumberError, UserNotFoundError } from '@blargbot/bbtag';
import { PardonSubtag } from '@blargbot/bbtag/subtags';
import * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new PardonSubtag(),
    argCountBounds: { min: 0, max: 3 },
    names: ['pardon'],
    cases: [
        {
            code: '{pardon}',
            expected: '0',
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.pardon(bbctx.local.message.member, bbctx.local.message.author, 1, 'Tag Pardon'))
                    .mustHappen(1)
                    .resolves(0);
            }
        },
        {
            code: '{pardon}',
            expected: '5',
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.pardon(bbctx.local.message.member, bbctx.local.message.author, 1, 'Tag Pardon'))
                    .mustHappen(1)
                    .resolves(5);
            }
        },
        {
            code: '{pardon;}',
            expected: '3',
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.pardon(bbctx.local.message.member, bbctx.local.message.author, 1, 'Tag Pardon'))
                    .mustHappen(1)
                    .resolves(3);
            }
        },
        {
            code: '{pardon;other user}',
            expected: '7',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup(m => m.pardon(member.instance, bbctx.local.message.author, 1, 'Tag Pardon'))
                    .mustHappen(1)
                    .resolves(7);
            }
        },
        {
            code: '{pardon;;6}',
            expected: '26',
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.pardon(bbctx.local.message.member, bbctx.local.message.author, 6, 'Tag Pardon'))
                    .mustHappen(1)
                    .resolves(26);
            }
        },
        {
            code: '{pardon;other user;9}',
            expected: '0',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup(m => m.pardon(member.instance, bbctx.local.message.author, 9, 'Tag Pardon'))
                    .mustHappen(1)
                    .resolves(0);
            }
        },
        {
            code: '{pardon;other user;8;Because I felt like it}',
            expected: '6',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, 'other user'))
                    .mustHappen(1)
                    .resolves([member.instance]);

                ctx.util.setup(m => m.pardon(member.instance, bbctx.local.message.author, 8, 'Because I felt like it'))
                    .mustHappen(1)
                    .resolves(6);
            }
        },
        {
            code: '{pardon;unknown user}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 21, error: new UserNotFoundError('unknown user') }
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
                { start: 0, end: 23, error: new NotANumberError('abc') }
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
