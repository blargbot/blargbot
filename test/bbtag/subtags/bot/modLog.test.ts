import { UserNotFoundError } from '@blargbot/bbtag';
import { ModLogSubtag } from '@blargbot/bbtag/subtags';
import type * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new ModLogSubtag(),
    argCountBounds: { min: 2, max: 5 },
    names: ['modLog'],
    cases: [
        {
            code: '{modlog;poke;023634983746234834}',
            expected: '',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<eris.User>();
                const member = ctx.createMock<eris.Member>();
                member.setup(m => m.user).returns(user.instance);

                ctx.util.setup(m => m.getUser('023634983746234834')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, '023634983746234834')).resolves([member.instance]);
                ctx.util.setup(m => m.addModLog(bbctx.local.message.channel.guild, 'poke', user.instance, bbctx.local.message.author, '', undefined)).resolves(undefined);
            }
        },
        {
            code: '{modlog;poke;023634983746234834;2365432687945234625}',
            expected: '',
            postSetup(bbctx, ctx) {
                const user1 = ctx.createMock<eris.User>();
                const member1 = ctx.createMock<eris.Member>();
                member1.setup(m => m.user).returns(user1.instance);

                const user2 = ctx.createMock<eris.User>();
                const member2 = ctx.createMock<eris.Member>();
                member2.setup(m => m.user).returns(user2.instance);

                ctx.util.setup(m => m.getUser('023634983746234834')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, '023634983746234834')).resolves([member1.instance]);
                ctx.util.setup(m => m.getUser('2365432687945234625')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, '2365432687945234625')).resolves([member2.instance]);
                ctx.util.setup(m => m.addModLog(bbctx.local.message.channel.guild, 'poke', user1.instance, user2.instance, '', undefined)).resolves(undefined);
            }
        },
        {
            code: '{modlog;poke;023634983746234834;2365432687945234625;power abuse is fun}',
            expected: '',
            postSetup(bbctx, ctx) {
                const user1 = ctx.createMock<eris.User>();
                const member1 = ctx.createMock<eris.Member>();
                member1.setup(m => m.user).returns(user1.instance);

                const user2 = ctx.createMock<eris.User>();
                const member2 = ctx.createMock<eris.Member>();
                member2.setup(m => m.user).returns(user2.instance);

                ctx.util.setup(m => m.getUser('023634983746234834')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, '023634983746234834')).resolves([member1.instance]);
                ctx.util.setup(m => m.getUser('2365432687945234625')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, '2365432687945234625')).resolves([member2.instance]);
                ctx.util.setup(m => m.addModLog(bbctx.local.message.channel.guild, 'poke', user1.instance, user2.instance, 'power abuse is fun', undefined)).resolves(undefined);
            }
        },
        {
            code: '{modlog;poke;023634983746234834;2365432687945234625;power abuse is fun;red}',
            expected: '',
            postSetup(bbctx, ctx) {
                const user1 = ctx.createMock<eris.User>();
                const member1 = ctx.createMock<eris.Member>();
                member1.setup(m => m.user).returns(user1.instance);

                const user2 = ctx.createMock<eris.User>();
                const member2 = ctx.createMock<eris.Member>();
                member2.setup(m => m.user).returns(user2.instance);

                ctx.util.setup(m => m.getUser('023634983746234834')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, '023634983746234834')).resolves([member1.instance]);
                ctx.util.setup(m => m.getUser('2365432687945234625')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, '2365432687945234625')).resolves([member2.instance]);
                ctx.util.setup(m => m.addModLog(bbctx.local.message.channel.guild, 'poke', user1.instance, user2.instance, 'power abuse is fun', 0xff0000)).resolves(undefined);
            }
        },
        {
            code: '{modlog;poke;023634983746234834;;;}',
            expected: '',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<eris.User>();
                const member = ctx.createMock<eris.Member>();
                member.setup(m => m.user).returns(user.instance);

                ctx.util.setup(m => m.getUser('023634983746234834')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, '023634983746234834')).resolves([member.instance]);
                ctx.util.setup(m => m.addModLog(bbctx.local.message.channel.guild, 'poke', user.instance, bbctx.local.message.author, '', undefined)).resolves(undefined);
            }
        },
        {
            code: '{modlog;poke;023634983746234834;;;}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 35, error: new UserNotFoundError('023634983746234834') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.getUser('023634983746234834')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.local.message.channel.guild, '023634983746234834')).resolves([]);
            }
        }
    ]
});
