import { BBTagRuntimeError, NotANumberError, UserNotFoundError } from '@blargbot/bbtag';
import type { BanUserFeature } from '@blargbot/bbtag/subtags';
import { BanSubtag, UserIdSubtag } from '@blargbot/bbtag/subtags';
import { snowflake } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';
import moment from 'moment-timezone';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<BanUserFeature>({ id: 'features' });
const userIdSubtag = new Mock<UserIdSubtag>({ id: 'UserIdSubtag' });

await runSubtagTests({
    subtag: new BanSubtag(features.instance),
    argCountBounds: { min: 1, max: 5 },
    names: ['ban'],
    otherSubtags: [userIdSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptSubtagMock(userIdSubtag, { type: UserIdSubtag });
    },
    cases: [
        {
            code: '{ban;abc}',
            expected: '`No user found`',
            errors: [
                { error: new UserNotFoundError('abc') }
            ],
            postSetup(bbctx) {
                userIdSubtag.setup((m, $) => m.query(bbctx, 'abc', $({ noLookup: true, global: true })))
                    .resolves(undefined)
                    .mustHappen(1);
            }
        },
        {
            code: '{ban;other user}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('Bot has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'bot' });
            }
        },
        {
            code: '{ban;other user}',
            expected: '`User has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('User has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'authorizer' });
            }
        },
        {
            code: '{ban;other user}',
            expected: '`User has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('User has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'authorizer' });
            }
        },
        {
            code: '{ban;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('Bot has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'bot' });
            }
        },
        {
            code: '{ban;other user;5}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    daysToDelete: 5,
                    reason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user;-1}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    daysToDelete: -1,
                    reason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user;abc}',
            expected: 'false',
            errors: [
                { error: new NotANumberError('abc').withDisplay('false') }
            ],
            postSetup(bbctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);
            }
        },
        {
            code: '{ban;other user;;My custom reason}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    daysToDelete: 1,
                    reason: 'My custom reason',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user;7;My custom reason}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    daysToDelete: 7,
                    reason: 'My custom reason',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user;;;5 days}',
            expected: '432000000',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    unbanAfter: moment.duration({ days: 5 })
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user;7;My custom reason;2 hours}',
            expected: '7200000',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId: bbctx.local.message.author.id,
                    daysToDelete: 7,
                    reason: 'My custom reason',
                    unbanAfter: moment.duration({ hours: 2 })
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user;;;;x}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const authorizerId = ctx.users.authorizer.id;
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user;;;;false}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const authorizerId = ctx.users.authorizer.id;
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user;;;;true}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const authorizerId = ctx.users.authorizer.id;
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId,
                    daysToDelete: 1,
                    reason: 'Tag Ban',
                    unbanAfter: undefined
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{ban;other user;4;My custom reason;2 hours 30s;abc}',
            expected: '7230000',
            postSetup(bbctx, ctx) {
                const authorizerId = ctx.users.authorizer.id;
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.banUser($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: bbctx.local.message.author.id,
                    authorizerId,
                    daysToDelete: 4,
                    reason: 'My custom reason',
                    unbanAfter: moment.duration({ hours: 2, seconds: 30 })
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        }
    ]
});
