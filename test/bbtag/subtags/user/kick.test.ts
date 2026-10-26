import { BBTagRuntimeError, UserNotFoundError } from '@blargbot/bbtag';
import type { KickMemberFeature } from '@blargbot/bbtag/subtags';
import { KickSubtag, UserIdSubtag } from '@blargbot/bbtag/subtags';
import { snowflake } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<KickMemberFeature>({ id: 'features' });
const userIdSubtag = new Mock<UserIdSubtag>({ id: 'UserIdSubtag' });

await runSubtagTests({
    subtag: new KickSubtag(features.instance),
    argCountBounds: { min: 1, max: 3 },
    names: ['kick'],
    otherSubtags: [userIdSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptSubtagMock(userIdSubtag, { type: UserIdSubtag });
    },
    cases: [
        {
            code: '{kick;abc}',
            expected: '`No user found`',
            errors: [
                { error: new UserNotFoundError('abc') }
            ],
            postSetup(bbctx) {
                userIdSubtag.setup((m, $) => m.query(bbctx, 'abc', $({ noLookup: true })))
                    .resolves(undefined)
                    .mustHappen(1);
            }
        },
        {
            code: '{kick;other user}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.kickMember($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: ctx.users.command.id,
                    authorizerId: ctx.users.command.id,
                    reason: 'Tag Kick'
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{kick;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to kick users!') }
            ],
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.kickMember($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: ctx.users.command.id,
                    authorizerId: ctx.users.command.id,
                    reason: 'Tag Kick'
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'bot', reason: 'I don\'t have permission to kick users!' });
            }
        },
        {
            code: '{kick;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to kick other user!') }
            ],
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.kickMember($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: ctx.users.command.id,
                    authorizerId: ctx.users.command.id,
                    reason: 'Tag Kick'
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'bot', reason: 'I don\'t have permission to kick other user!' });
            }
        },
        {
            code: '{kick;other user}',
            expected: '`User has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to kick users!') }
            ],
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.kickMember($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: ctx.users.command.id,
                    authorizerId: ctx.users.command.id,
                    reason: 'Tag Kick'
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'authorizer', reason: 'You don\'t have permission to kick users!' });
            }
        },
        {
            code: '{kick;other user}',
            expected: '`User has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to kick other user!') }
            ],
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.kickMember($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: ctx.users.command.id,
                    authorizerId: ctx.users.command.id,
                    reason: 'Tag Kick'
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'authorizer', reason: 'You don\'t have permission to kick other user!' });
            }
        },
        {
            code: '{kick;other user;My reason here}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.kickMember($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: ctx.users.command.id,
                    authorizerId: ctx.users.command.id,
                    reason: 'My reason here'
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{kick;other user;My reason here;x}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.kickMember($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: ctx.users.command.id,
                    authorizerId: ctx.users.authorizer.id,
                    reason: 'My reason here'
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{kick;other user;My reason here;}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.kickMember($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: ctx.users.command.id,
                    authorizerId: ctx.users.command.id,
                    reason: 'My reason here'
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        }
    ]
});
