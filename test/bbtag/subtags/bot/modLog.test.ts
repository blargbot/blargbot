import { UserNotFoundError } from '@blargbot/bbtag';
import type { AddModLogThunk } from '@blargbot/bbtag/subtags';
import { ModLogSubtag } from '@blargbot/bbtag/subtags';
import { snowflake } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';
import type * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

const addModLog = new Mock<AddModLogThunk>({ id: 'addModLog', callable: true });

await runSubtagTests({
    subtag: new ModLogSubtag({
        addModLog: addModLog.instance
    }),
    argCountBounds: { min: 2, max: 5 },
    names: ['modLog'],
    setup(ctx) {
        ctx.adoptMock(addModLog);
    },
    cases: [
        {
            code: '{modlog;poke;023634983746234834}',
            expected: '',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<eris.User>({ id: 'user' });
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const userId = snowflake.create().toString();
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns(userId);

                ctx.util.setup(m => m.getUser('023634983746234834')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '023634983746234834')).resolves([member.instance]);
                addModLog.setup((m, $) => m($({
                    guildId: bbctx.root.guildId,
                    action: 'poke',
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    reason: '',
                    color: undefined
                }))).resolves(undefined);
            }
        },
        {
            code: '{modlog;poke;023634983746234834;2365432687945234625}',
            expected: '',
            postSetup(bbctx, ctx) {
                const user1 = ctx.createMock<eris.User>({ id: 'user1' });
                const member1 = ctx.createMock<eris.Member>({ id: 'member1' });
                const user1Id = snowflake.create().toString();
                member1.setup(m => m.user).returns(user1.instance);
                user1.setup(m => m.id).returns(user1Id);

                const user2 = ctx.createMock<eris.User>({ id: 'user2' });
                const member2 = ctx.createMock<eris.Member>({ id: 'member2' });
                const user2Id = snowflake.create().toString();
                member2.setup(m => m.user).returns(user2.instance);
                user2.setup(m => m.id).returns(user2Id);

                ctx.util.setup(m => m.getUser('023634983746234834')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '023634983746234834')).resolves([member1.instance]);
                ctx.util.setup(m => m.getUser('2365432687945234625')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '2365432687945234625')).resolves([member2.instance]);
                addModLog.setup((m, $) => m($({
                    guildId: bbctx.root.guildId,
                    action: 'poke',
                    targetId: user1Id,
                    moderatorId: user2Id,
                    reason: '',
                    color: undefined
                }))).resolves(undefined);
            }
        },
        {
            code: '{modlog;poke;023634983746234834;2365432687945234625;power abuse is fun}',
            expected: '',
            postSetup(bbctx, ctx) {
                const user1 = ctx.createMock<eris.User>({ id: 'user1' });
                const member1 = ctx.createMock<eris.Member>({ id: 'member1' });
                const user1Id = snowflake.create().toString();
                member1.setup(m => m.user).returns(user1.instance);
                user1.setup(m => m.id).returns(user1Id);

                const user2 = ctx.createMock<eris.User>({ id: 'user2' });
                const member2 = ctx.createMock<eris.Member>({ id: 'member2' });
                const user2Id = snowflake.create().toString();
                member2.setup(m => m.user).returns(user2.instance);
                user2.setup(m => m.id).returns(user2Id);

                ctx.util.setup(m => m.getUser('023634983746234834')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '023634983746234834')).resolves([member1.instance]);
                ctx.util.setup(m => m.getUser('2365432687945234625')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '2365432687945234625')).resolves([member2.instance]);
                addModLog.setup((m, $) => m($({
                    guildId: bbctx.root.guildId,
                    action: 'poke',
                    targetId: user1Id,
                    moderatorId: user2Id,
                    reason: 'power abuse is fun',
                    color: undefined
                }))).resolves(undefined);
            }
        },
        {
            code: '{modlog;poke;023634983746234834;2365432687945234625;power abuse is fun;red}',
            expected: '',
            postSetup(bbctx, ctx) {
                const user1 = ctx.createMock<eris.User>({ id: 'user1' });
                const member1 = ctx.createMock<eris.Member>({ id: 'member1' });
                const user1Id = snowflake.create().toString();
                member1.setup(m => m.user).returns(user1.instance);
                user1.setup(m => m.id).returns(user1Id);

                const user2 = ctx.createMock<eris.User>({ id: 'user2' });
                const member2 = ctx.createMock<eris.Member>({ id: 'member2' });
                const user2Id = snowflake.create().toString();
                member2.setup(m => m.user).returns(user2.instance);
                user2.setup(m => m.id).returns(user2Id);

                ctx.util.setup(m => m.getUser('023634983746234834')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '023634983746234834')).resolves([member1.instance]);
                ctx.util.setup(m => m.getUser('2365432687945234625')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '2365432687945234625')).resolves([member2.instance]);
                addModLog.setup((m, $) => m($({
                    guildId: bbctx.root.guildId,
                    action: 'poke',
                    targetId: user1Id,
                    moderatorId: user2Id,
                    reason: 'power abuse is fun',
                    color: 0xff0000
                }))).resolves(undefined);
            }
        },
        {
            code: '{modlog;poke;023634983746234834;;;}',
            expected: '',
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<eris.User>({ id: 'user' });
                const member = ctx.createMock<eris.Member>({ id: 'member' });
                const userId = snowflake.create().toString();
                member.setup(m => m.user).returns(user.instance);
                user.setup(m => m.id).returns(userId);

                ctx.util.setup(m => m.getUser('023634983746234834')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '023634983746234834')).resolves([member.instance]);
                addModLog.setup((m, $) => m($({
                    guildId: bbctx.root.guildId,
                    action: 'poke',
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    reason: '',
                    color: undefined
                }))).resolves(undefined);
            }
        },
        {
            code: '{modlog;poke;023634983746234834;;;}',
            expected: '`No user found`',
            errors: [
                { error: new UserNotFoundError('023634983746234834') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.getUser('023634983746234834')).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '023634983746234834')).resolves([]);
            }
        }
    ]
});
