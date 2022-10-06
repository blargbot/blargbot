import { BBTagRuntimeError, UserNotFoundError } from '@blargbot/bbtag/errors';
import { KickSubtag } from '@blargbot/bbtag/subtags/user/kick';
import { Member, User } from 'eris';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new KickSubtag(),
    argCountBounds: { min: 1, max: 3 },
    cases: [
        {
            code: `{kick;abc}`,
            expected: `\`No user found\``,
            errors: [
                { start: 0, end: 10, error: new UserNotFoundError(`abc`) }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findMembers(bbctx.guild, `abc`))
                    .verifiable(1)
                    .thenResolve([]);
            }
        },
        {
            code: `{kick;other user}`,
            expected: `Success`,
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                ctx.util.setup(m => m.findMembers(bbctx.guild, `other user`))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(x => x.kick(member.instance, bbctx.user, bbctx.user, `Tag Kick`))
                    .verifiable(1)
                    .thenResolve(`success`);
            }
        },
        {
            code: `{kick;other user}`,
            expected: `\`Bot has no permissions\``,
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError(`Bot has no permissions`, `I don't have permission to kick users!`) }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                ctx.util.setup(m => m.findMembers(bbctx.guild, `other user`))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(x => x.kick(member.instance, bbctx.user, bbctx.user, `Tag Kick`))
                    .verifiable(1)
                    .thenResolve(`noPerms`);
            }
        },
        {
            code: `{kick;other user}`,
            expected: `\`Bot has no permissions\``,
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError(`Bot has no permissions`, `I don't have permission to kick other user!`) }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                user.setup(m => m.username).thenReturn(`other user`);
                ctx.util.setup(m => m.findMembers(bbctx.guild, `other user`))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(x => x.kick(member.instance, bbctx.user, bbctx.user, `Tag Kick`))
                    .verifiable(1)
                    .thenResolve(`memberTooHigh`);
            }
        },
        {
            code: `{kick;other user}`,
            expected: `\`User has no permissions\``,
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError(`User has no permissions`, `You don't have permission to kick users!`) }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                ctx.util.setup(m => m.findMembers(bbctx.guild, `other user`))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(x => x.kick(member.instance, bbctx.user, bbctx.user, `Tag Kick`))
                    .verifiable(1)
                    .thenResolve(`moderatorNoPerms`);
            }
        },
        {
            code: `{kick;other user}`,
            expected: `\`User has no permissions\``,
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError(`User has no permissions`, `You don't have permission to kick other user!`) }
            ],
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const user = ctx.createMock(User);
                member.setup(m => m.user).thenReturn(user.instance);
                user.setup(m => m.username).thenReturn(`other user`);
                ctx.util.setup(m => m.findMembers(bbctx.guild, `other user`))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(x => x.kick(member.instance, bbctx.user, bbctx.user, `Tag Kick`))
                    .verifiable(1)
                    .thenResolve(`moderatorTooLow`);
            }
        },
        {
            code: `{kick;other user;My reason here}`,
            expected: `Success`,
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                ctx.util.setup(m => m.findMembers(bbctx.guild, `other user`))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(x => x.kick(member.instance, bbctx.user, bbctx.user, `My reason here`))
                    .verifiable(1)
                    .thenResolve(`success`);
            }
        },
        {
            code: `{kick;other user;My reason here;x}`,
            expected: `Success`,
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                const authorizer = bbctx.guild.members.get(ctx.users.authorizer.id)?.user;
                if (authorizer === undefined)
                    throw new Error(`Authorizer missing`);
                ctx.util.setup(m => m.findMembers(bbctx.guild, `other user`))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(x => x.kick(member.instance, bbctx.user, authorizer, `My reason here`))
                    .verifiable(1)
                    .thenResolve(`success`);
            }
        },
        {
            code: `{kick;other user;My reason here;}`,
            expected: `Success`,
            postSetup(bbctx, ctx) {
                const member = ctx.createMock(Member);
                ctx.util.setup(m => m.findMembers(bbctx.guild, `other user`))
                    .verifiable(1)
                    .thenResolve([member.instance]);

                ctx.util.setup(x => x.kick(member.instance, bbctx.user, bbctx.user, `My reason here`))
                    .verifiable(1)
                    .thenResolve(`success`);
            }
        }
    ]
});
