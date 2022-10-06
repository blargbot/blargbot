import { UserNotFoundError } from '@blargbot/bbtag/errors';
import { ModlogSubtag } from '@blargbot/bbtag/subtags/bot/modlog';
import { Member, User } from 'eris';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ModlogSubtag(),
    argCountBounds: { min: 2, max: 5 },
    cases: [
        {
            code: `{modlog;poke;023634983746234834}`,
            expected: ``,
            postSetup(bbctx, ctx) {
                const user = ctx.createMock(User);
                const member = ctx.createMock(Member);
                member.setup(m => m.user).thenReturn(user.instance);

                ctx.util.setup(m => m.getUser(`023634983746234834`)).thenResolve(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.guild, `023634983746234834`)).thenResolve([member.instance]);
                ctx.util.setup(m => m.addModlog(bbctx.guild, `poke`, user.instance, bbctx.user, ``, undefined)).thenResolve(undefined);
            }
        },
        {
            code: `{modlog;poke;023634983746234834;2365432687945234625}`,
            expected: ``,
            postSetup(bbctx, ctx) {
                const user1 = ctx.createMock(User);
                const member1 = ctx.createMock(Member);
                member1.setup(m => m.user).thenReturn(user1.instance);

                const user2 = ctx.createMock(User);
                const member2 = ctx.createMock(Member);
                member2.setup(m => m.user).thenReturn(user2.instance);

                ctx.util.setup(m => m.getUser(`023634983746234834`)).thenResolve(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.guild, `023634983746234834`)).thenResolve([member1.instance]);
                ctx.util.setup(m => m.getUser(`2365432687945234625`)).thenResolve(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.guild, `2365432687945234625`)).thenResolve([member2.instance]);
                ctx.util.setup(m => m.addModlog(bbctx.guild, `poke`, user1.instance, user2.instance, ``, undefined)).thenResolve(undefined);
            }
        },
        {
            code: `{modlog;poke;023634983746234834;2365432687945234625;power abuse is fun}`,
            expected: ``,
            postSetup(bbctx, ctx) {
                const user1 = ctx.createMock(User);
                const member1 = ctx.createMock(Member);
                member1.setup(m => m.user).thenReturn(user1.instance);

                const user2 = ctx.createMock(User);
                const member2 = ctx.createMock(Member);
                member2.setup(m => m.user).thenReturn(user2.instance);

                ctx.util.setup(m => m.getUser(`023634983746234834`)).thenResolve(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.guild, `023634983746234834`)).thenResolve([member1.instance]);
                ctx.util.setup(m => m.getUser(`2365432687945234625`)).thenResolve(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.guild, `2365432687945234625`)).thenResolve([member2.instance]);
                ctx.util.setup(m => m.addModlog(bbctx.guild, `poke`, user1.instance, user2.instance, `power abuse is fun`, undefined)).thenResolve(undefined);
            }
        },
        {
            code: `{modlog;poke;023634983746234834;2365432687945234625;power abuse is fun;red}`,
            expected: ``,
            postSetup(bbctx, ctx) {
                const user1 = ctx.createMock(User);
                const member1 = ctx.createMock(Member);
                member1.setup(m => m.user).thenReturn(user1.instance);

                const user2 = ctx.createMock(User);
                const member2 = ctx.createMock(Member);
                member2.setup(m => m.user).thenReturn(user2.instance);

                ctx.util.setup(m => m.getUser(`023634983746234834`)).thenResolve(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.guild, `023634983746234834`)).thenResolve([member1.instance]);
                ctx.util.setup(m => m.getUser(`2365432687945234625`)).thenResolve(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.guild, `2365432687945234625`)).thenResolve([member2.instance]);
                ctx.util.setup(m => m.addModlog(bbctx.guild, `poke`, user1.instance, user2.instance, `power abuse is fun`, 0xff0000)).thenResolve(undefined);
            }
        },
        {
            code: `{modlog;poke;023634983746234834;;;}`,
            expected: ``,
            postSetup(bbctx, ctx) {
                const user = ctx.createMock(User);
                const member = ctx.createMock(Member);
                member.setup(m => m.user).thenReturn(user.instance);

                ctx.util.setup(m => m.getUser(`023634983746234834`)).thenResolve(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.guild, `023634983746234834`)).thenResolve([member.instance]);
                ctx.util.setup(m => m.addModlog(bbctx.guild, `poke`, user.instance, bbctx.user, ``, undefined)).thenResolve(undefined);
            }
        },
        {
            code: `{modlog;poke;023634983746234834;;;}`,
            expected: `\`No user found\``,
            errors: [
                { start: 0, end: 35, error: new UserNotFoundError(`023634983746234834`) }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.getUser(`023634983746234834`)).thenResolve(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.guild, `023634983746234834`)).thenResolve([]);
            }
        }
    ]
});
