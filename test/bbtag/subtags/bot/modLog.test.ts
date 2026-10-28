import { UserNotFoundError } from '@blargbot/bbtag';
import type { AddModLogFeature } from '@blargbot/bbtag/subtags';
import { ModLogSubtag, UserIdSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { createSnowflake } from '../../snowflake.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<AddModLogFeature>({ id: 'features' });
const userIdSubtag = new Mock<UserIdSubtag>({ id: 'UserIdSubtag' });

await runSubtagTests({
    subtag: new ModLogSubtag(features.instance),
    argCountBounds: { min: 2, max: 5 },
    names: ['modLog'],
    otherSubtags: [userIdSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptSubtagMock(userIdSubtag, { type: UserIdSubtag });
    },
    cases: [
        {
            code: '{modlog;poke;023634983746234834}',
            expected: '',
            postSetup(bbctx, ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(bbctx, '023634983746234834', $({ global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, '', $({ global: true })))
                    .resolves(ctx.userId)
                    .mustHappen(1);
                features.setup((m, $) => m.addModLog($({
                    guildId: bbctx.root.guildId,
                    action: 'poke',
                    targetId: userId,
                    moderatorId: ctx.userId,
                    reason: '',
                    color: undefined
                }))).resolves(undefined);
            }
        },
        {
            code: '{modlog;poke;023634983746234834;2365432687945234625}',
            expected: '',
            postSetup(bbctx) {
                const user1Id = createSnowflake();
                const user2Id = createSnowflake();

                userIdSubtag.setup((m, $) => m.query(bbctx, '023634983746234834', $({ global: true })))
                    .resolves(user1Id)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, '2365432687945234625', $({ global: true })))
                    .resolves(user2Id)
                    .mustHappen(1);
                features.setup((m, $) => m.addModLog($({
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
            postSetup(bbctx) {
                const user1Id = createSnowflake();
                const user2Id = createSnowflake();

                userIdSubtag.setup((m, $) => m.query(bbctx, '023634983746234834', $({ global: true })))
                    .resolves(user1Id)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, '2365432687945234625', $({ global: true })))
                    .resolves(user2Id)
                    .mustHappen(1);
                features.setup((m, $) => m.addModLog($({
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
            postSetup(bbctx) {
                const user1Id = createSnowflake();
                const user2Id = createSnowflake();

                userIdSubtag.setup((m, $) => m.query(bbctx, '023634983746234834', $({ global: true })))
                    .resolves(user1Id)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, '2365432687945234625', $({ global: true })))
                    .resolves(user2Id)
                    .mustHappen(1);
                features.setup((m, $) => m.addModLog($({
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
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(bbctx, '023634983746234834', $({ global: true })))
                    .resolves(userId)
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, '', $({ global: true })))
                    .resolves(ctx.userId)
                    .mustHappen(1);
                features.setup((m, $) => m.addModLog($({
                    guildId: bbctx.root.guildId,
                    action: 'poke',
                    targetId: userId,
                    moderatorId: ctx.userId,
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
            postSetup(bbctx) {
                userIdSubtag.setup((m, $) => m.query(bbctx, '023634983746234834', $({ global: true })))
                    .resolves(undefined)
                    .mustHappen(1);
            }
        }
    ]
});
