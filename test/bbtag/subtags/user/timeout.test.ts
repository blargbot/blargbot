import { BBTagRuntimeError, UserNotFoundError } from '@blargbot/bbtag';
import type { SetUserTimeoutFeature } from '@blargbot/bbtag/subtags';
import { TimeoutSubtag, UserIdSubtag } from '@blargbot/bbtag/subtags';
import { snowflake } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';
import moment from 'moment-timezone';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<SetUserTimeoutFeature>({ id: 'features' });
const userIdSubtag = new Mock<UserIdSubtag>({ id: 'UserIdSubtag' });

await runSubtagTests({
    subtag: new TimeoutSubtag(features.instance),
    argCountBounds: { min: 2, max: 4 },
    names: ['timeout'],
    otherSubtags: [userIdSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptSubtagMock(userIdSubtag, { type: UserIdSubtag });
    },
    cases: [
        {
            code: '{timeout;other user;abc}',
            expected: '`Invalid duration`',
            errors: [
                { error: new BBTagRuntimeError('Invalid duration') }
            ]
        },
        {
            code: '{timeout;abc;1s}',
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
            code: '{timeout;other user;1s}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.setMemberTimeout($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: ctx.users.command.id,
                    authorizerId: ctx.users.command.id,
                    reason: 'Tag Timeout',
                    duration: moment.duration({ seconds: 1 })
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{timeout;other user;29d}',
            expected: 'Success',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.setMemberTimeout($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: ctx.users.command.id,
                    authorizerId: ctx.users.command.id,
                    reason: 'Tag Timeout',
                    duration: moment.duration({ days: 29 })
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{timeout;other user;-1d}',
            expected: '`Invalid duration`',
            errors: [
                { error: new BBTagRuntimeError('Invalid duration') }
            ]
        },
        {
            code: '{timeout;other user;0s}',
            expected: '`User is not timed out`',
            errors: [
                { error: new BBTagRuntimeError('User is not timed out', 'other user is not timed out!') }
            ],
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.setMemberTimeout($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: ctx.users.command.id,
                    authorizerId: ctx.users.command.id,
                    reason: 'Tag Timeout',
                    duration: moment.duration({ seconds: 0 })
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'noChange', reason: 'other user is not timed out!' });
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`User is already timed out`',
            errors: [
                { error: new BBTagRuntimeError('User is already timed out', 'other user is already timed out!') }
            ],
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.setMemberTimeout($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: ctx.users.command.id,
                    authorizerId: ctx.users.command.id,
                    reason: 'Tag Timeout',
                    duration: moment.duration({ seconds: 1 })
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'noChange', reason: 'other user is already timed out!' });
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`Bot has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to (remove) time out (from) users!') }
            ],
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.setMemberTimeout($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: ctx.users.command.id,
                    authorizerId: ctx.users.command.id,
                    reason: 'Tag Timeout',
                    duration: moment.duration({ seconds: 1 })
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'bot', reason: 'I don\'t have permission to (remove) time out (from) users!' });
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`Bot has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to (remove) time out (from) other user!') }
            ],
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.setMemberTimeout($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: ctx.users.command.id,
                    authorizerId: ctx.users.command.id,
                    reason: 'Tag Timeout',
                    duration: moment.duration({ seconds: 1 })
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'bot', reason: 'I don\'t have permission to (remove) time out (from) other user!' });
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`User has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to (remove) time out (from) users!') }
            ],
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.setMemberTimeout($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: ctx.users.command.id,
                    authorizerId: ctx.users.command.id,
                    reason: 'Tag Timeout',
                    duration: moment.duration({ seconds: 1 })
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'authorizer', reason: 'You don\'t have permission to (remove) time out (from) users!' });
            }
        },
        {
            code: '{timeout;other user;1s}',
            expected: '`User has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to (remove) time out (from) other user!') }
            ],
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.setMemberTimeout($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: ctx.users.command.id,
                    authorizerId: ctx.users.command.id,
                    reason: 'Tag Timeout',
                    duration: moment.duration({ seconds: 1 })
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'authorizer', reason: 'You don\'t have permission to (remove) time out (from) other user!' });
            }
        }
    ]
});
