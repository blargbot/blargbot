import { BBTagRuntimeError, UserNotFoundError } from '@blargbot/bbtag';
import type { UnbanUserFeature } from '@blargbot/bbtag/subtags';
import { UnbanSubtag, UserIdSubtag } from '@blargbot/bbtag/subtags';
import { snowflake } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<UnbanUserFeature>({ id: 'features' });
const userIdSubtag = new Mock<UserIdSubtag>({ id: 'UserIdSubtag' });

await runSubtagTests({
    subtag: new UnbanSubtag(features.instance),
    argCountBounds: { min: 1, max: 3 },
    names: ['unban'],
    otherSubtags: [userIdSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptSubtagMock(userIdSubtag, { type: UserIdSubtag });
    },
    cases: [
        {
            code: '{unban;abc}',
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
            code: '{unban;other user}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.unbanUser($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: ctx.users.command.id,
                    authorizerId: ctx.users.command.id,
                    reason: 'Tag Unban'
                })))
                    .mustHappen(1)
                    .resolves({ success: true });
            }
        },
        {
            code: '{unban;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('Bot has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.unbanUser($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: ctx.users.command.id,
                    authorizerId: ctx.users.command.id,
                    reason: 'Tag Unban'
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'bot' });
            }
        },
        {
            code: '{unban;other user}',
            expected: 'false',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.unbanUser($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: ctx.users.command.id,
                    authorizerId: ctx.users.command.id,
                    reason: 'Tag Unban'
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'notBanned' });
            }
        },
        {
            code: '{unban;other user}',
            expected: '`User has no permissions`',
            errors: [
                { error: new BBTagRuntimeError('User has no permissions') }
            ],
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.unbanUser($({
                    guildId: ctx.guild.id,
                    targetId: userId,
                    moderatorId: ctx.users.command.id,
                    authorizerId: ctx.users.command.id,
                    reason: 'Tag Unban'
                })))
                    .mustHappen(1)
                    .resolves({ success: false, cause: 'authorizer' });
            }
        },
        {
            code: '{unban;other user;My reason here}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.unbanUser($({
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
            code: '{unban;other user;My reason here;x}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.unbanUser($({
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
            code: '{unban;other user;My reason here;}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true, global: true })))
                    .resolves(userId)
                    .mustHappen(1);

                features.setup((m, $) => m.unbanUser($({
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
