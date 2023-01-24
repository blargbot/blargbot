import { Subtag } from '@blargbot/bbtag';
import { UserNotFoundError } from '@blargbot/bbtag/errors/index.js';
import { ModLogSubtag } from '@blargbot/bbtag/subtags/bot/modLog.js';
import * as Eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ModLogSubtag),
    argCountBounds: { min: 2, max: 5 },
    cases: [
        {
            code: '{modlog;poke;023634983746234834}',
            expected: '',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock(Eris.User);
                const member = ctx.createMock(Eris.Member);
                member.setup(m => m.user).thenReturn(user.instance);

                ctx.util.setup(m => m.getUser('023634983746234834')).thenResolve(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.guild, '023634983746234834')).thenResolve([member.instance]);
                ctx.util.setup(m => m.addModLog(bbctx.guild, 'poke', user.instance, bbctx.user, '', undefined)).thenResolve(undefined);
            }
        },
        {
            code: '{modlog;poke;023634983746234834;2365432687945234625}',
            expected: '',
            postSetup(bbctx, ctx) {
                const user1 = ctx.createMock(Eris.User);
                const member1 = ctx.createMock(Eris.Member);
                member1.setup(m => m.user).thenReturn(user1.instance);

                const user2 = ctx.createMock(Eris.User);
                const member2 = ctx.createMock(Eris.Member);
                member2.setup(m => m.user).thenReturn(user2.instance);

                ctx.util.setup(m => m.getUser('023634983746234834')).thenResolve(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.guild, '023634983746234834')).thenResolve([member1.instance]);
                ctx.util.setup(m => m.getUser('2365432687945234625')).thenResolve(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.guild, '2365432687945234625')).thenResolve([member2.instance]);
                ctx.util.setup(m => m.addModLog(bbctx.guild, 'poke', user1.instance, user2.instance, '', undefined)).thenResolve(undefined);
            }
        },
        {
            code: '{modlog;poke;023634983746234834;2365432687945234625;power abuse is fun}',
            expected: '',
            postSetup(bbctx, ctx) {
                const user1 = ctx.createMock(Eris.User);
                const member1 = ctx.createMock(Eris.Member);
                member1.setup(m => m.user).thenReturn(user1.instance);

                const user2 = ctx.createMock(Eris.User);
                const member2 = ctx.createMock(Eris.Member);
                member2.setup(m => m.user).thenReturn(user2.instance);

                ctx.util.setup(m => m.getUser('023634983746234834')).thenResolve(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.guild, '023634983746234834')).thenResolve([member1.instance]);
                ctx.util.setup(m => m.getUser('2365432687945234625')).thenResolve(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.guild, '2365432687945234625')).thenResolve([member2.instance]);
                ctx.util.setup(m => m.addModLog(bbctx.guild, 'poke', user1.instance, user2.instance, 'power abuse is fun', undefined)).thenResolve(undefined);
            }
        },
        {
            code: '{modlog;poke;023634983746234834;2365432687945234625;power abuse is fun;red}',
            expected: '',
            postSetup(bbctx, ctx) {
                const user1 = ctx.createMock(Eris.User);
                const member1 = ctx.createMock(Eris.Member);
                member1.setup(m => m.user).thenReturn(user1.instance);

                const user2 = ctx.createMock(Eris.User);
                const member2 = ctx.createMock(Eris.Member);
                member2.setup(m => m.user).thenReturn(user2.instance);

                ctx.util.setup(m => m.getUser('023634983746234834')).thenResolve(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.guild, '023634983746234834')).thenResolve([member1.instance]);
                ctx.util.setup(m => m.getUser('2365432687945234625')).thenResolve(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.guild, '2365432687945234625')).thenResolve([member2.instance]);
                ctx.util.setup(m => m.addModLog(bbctx.guild, 'poke', user1.instance, user2.instance, 'power abuse is fun', 0xff0000)).thenResolve(undefined);
            }
        },
        {
            code: '{modlog;poke;023634983746234834;;;}',
            expected: '',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock(Eris.User);
                const member = ctx.createMock(Eris.Member);
                member.setup(m => m.user).thenReturn(user.instance);

                ctx.util.setup(m => m.getUser('023634983746234834')).thenResolve(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.guild, '023634983746234834')).thenResolve([member.instance]);
                ctx.util.setup(m => m.addModLog(bbctx.guild, 'poke', user.instance, bbctx.user, '', undefined)).thenResolve(undefined);
            }
        },
        {
            code: '{modlog;poke;023634983746234834;;;}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 35, error: new UserNotFoundError('023634983746234834') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.getUser('023634983746234834')).thenResolve(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.guild, '023634983746234834')).thenResolve([]);
            }
        }
    ]
});
