import { WarnSubtag } from '@blargbot/bbtag/subtags/user/warn';
import { Member } from 'eris';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new WarnSubtag(),
    argCountBounds: { min: 0, max: 3 },
    cases: [
        {
            code: '{warn}',
            expected: '1',
            postSetup(bbctx, ctx) {
                const authorizer = bbctx.guild.members.get(ctx.users.authorizer.id)?.user;
                if (authorizer === undefined)
                    throw new Error('Authorizer missing');
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                ctx.util.setup(m => m.warn(bbctx.member!, bbctx.user, authorizer, 1, 'Tag Warning'))
                    .verifiable(1)
                    .thenResolve(1);
            }
        },
        {
            code: '{warn}',
            expected: '7',
            postSetup(bbctx, ctx) {
                const authorizer = bbctx.guild.members.get(ctx.users.authorizer.id)?.user;
                if (authorizer === undefined)
                    throw new Error('Authorizer missing');
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                ctx.util.setup(m => m.warn(bbctx.member!, bbctx.user, authorizer, 1, 'Tag Warning'))
                    .verifiable(1)
                    .thenResolve(7);
            }
        },
        {
            code: '{warn;}',
            expected: '2',
            postSetup(bbctx, ctx) {
                const authorizer = bbctx.guild.members.get(ctx.users.authorizer.id)?.user;
                if (authorizer === undefined)
                    throw new Error('Authorizer missing');
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                ctx.util.setup(m => m.warn(bbctx.member!, bbctx.user, authorizer, 1, 'Tag Warning'))
                    .verifiable(1)
                    .thenResolve(2);
            }
        },
        {
            code: '{warn;other user}',
            expected: '5',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const authorizer = bbctx.guild.members.get(ctx.users.authorizer.id)?.user;
                if (authorizer === undefined)
                    throw new Error('Authorizer missing');
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(m => m.warn(member.instance, bbctx.user, authorizer, 1, 'Tag Warning'))
                    .verifiable(1)
                    .thenResolve(5);
            }
        },
        {
            code: '{warn;;6}',
            expected: '29',
            postSetup(bbctx, ctx) {
                const authorizer = bbctx.guild.members.get(ctx.users.authorizer.id)?.user;
                if (authorizer === undefined)
                    throw new Error('Authorizer missing');
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                ctx.util.setup(m => m.warn(bbctx.member!, bbctx.user, authorizer, 6, 'Tag Warning'))
                    .verifiable(1)
                    .thenResolve(29);
            }
        },
        {
            code: '{warn;other user;9}',
            expected: '9',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const authorizer = bbctx.guild.members.get(ctx.users.authorizer.id)?.user;
                if (authorizer === undefined)
                    throw new Error('Authorizer missing');
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(m => m.warn(member.instance, bbctx.user, authorizer, 9, 'Tag Warning'))
                    .verifiable(1)
                    .thenResolve(9);
            }
        },
        {
            code: '{warn;;;My custom reason}',
            expected: '16',
            postSetup(bbctx, ctx) {
                const authorizer = bbctx.guild.members.get(ctx.users.authorizer.id)?.user;
                if (authorizer === undefined)
                    throw new Error('Authorizer missing');
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                ctx.util.setup(m => m.warn(bbctx.member!, bbctx.user, authorizer, 1, 'My custom reason'))
                    .verifiable(1)
                    .thenResolve(16);
            }
        },
        {
            code: '{warn;other user;6;My custom reason}',
            expected: '22',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const authorizer = bbctx.guild.members.get(ctx.users.authorizer.id)?.user;
                if (authorizer === undefined)
                    throw new Error('Authorizer missing');
                ctx.util.setup(m => m.findMembers(bbctx.guild, 'other user'))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(m => m.warn(member.instance, bbctx.user, authorizer, 6, 'My custom reason'))
                    .verifiable(1)
                    .thenResolve(22);
            }
        }
    ]
});
