import { NotANumberError, UserNotFoundError } from '@blargbot/bbtag/errors';
import { PardonSubtag } from '@blargbot/bbtag/subtags/user/pardon';
import { argument } from '@blargbot/test-util/mock';
import { Guild, Member } from 'eris';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new PardonSubtag(),
    argCountBounds: { min: 0, max: 3 },
    cases: [
        {
            code: '{pardon}',
            expected: '0',
            postSetup(bbctx, ctx) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                ctx.util.setup(m => m.pardon(bbctx.member!, bbctx.user, 1, 'Tag Pardon'))
                    .verifiable(1)
                    .thenResolve(0);
            }
        },
        {
            code: '{pardon}',
            expected: '5',
            postSetup(bbctx, ctx) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                ctx.util.setup(m => m.pardon(bbctx.member!, bbctx.user, 1, 'Tag Pardon'))
                    .verifiable(1)
                    .thenResolve(5);
            }
        },
        {
            code: '{pardon;}',
            expected: '3',
            postSetup(bbctx, ctx) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                ctx.util.setup(m => m.pardon(bbctx.member!, bbctx.user, 1, 'Tag Pardon'))
                    .verifiable(1)
                    .thenResolve(3);
            }
        },
        {
            code: '{pardon;other user}',
            expected: '7',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(m => m.pardon(member.instance, bbctx.user, 1, 'Tag Pardon'))
                    .verifiable(1)
                    .thenResolve(7);
            }
        },
        {
            code: '{pardon;;6}',
            expected: '26',
            postSetup(bbctx, ctx) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                ctx.util.setup(m => m.pardon(bbctx.member!, bbctx.user, 6, 'Tag Pardon'))
                    .verifiable(1)
                    .thenResolve(26);
            }
        },
        {
            code: '{pardon;other user;9}',
            expected: '0',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(m => m.pardon(member.instance, bbctx.user, 9, 'Tag Pardon'))
                    .verifiable(1)
                    .thenResolve(0);
            }
        },
        {
            code: '{pardon;other user;8;Because I felt like it}',
            expected: '6',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(m => m.pardon(member.instance, bbctx.user, 8, 'Because I felt like it'))
                    .verifiable(1)
                    .thenResolve(6);
            }
        },
        {
            code: '{pardon;unknown user}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 21, error: new UserNotFoundError('unknown user') }
            ],
            setup(ctx) {
                ctx.util.setup(m => m.findMembers(argument.isInstanceof(Guild).and(g => g.id === ctx.guild.id).value, 'unknown user'))
                    .verifiable(1)
                    .thenResolve([]);
            }
        },
        {
            code: '{pardon;other user;abc}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 23, error: new NotANumberError('abc') }
            ],
            setup(ctx) {
                const member = ctx.createMock(Member);
                ctx.util.setup(m => m.findMembers(argument.isInstanceof(Guild).and(g => g.id === ctx.guild.id).value, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);
            }
        }
    ]
});
