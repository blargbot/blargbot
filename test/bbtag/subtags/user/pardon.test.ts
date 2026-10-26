import { NotANumberError, UserNotFoundError } from '@blargbot/bbtag';
import type { PardonFeature } from '@blargbot/bbtag/subtags';
import { PardonSubtag, UserIdSubtag } from '@blargbot/bbtag/subtags';
import { snowflake } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<PardonFeature>({ id: 'features' });
const userIdSubtag = new Mock<UserIdSubtag>({ id: 'UserIdSubtag' });

await runSubtagTests({
    subtag: new PardonSubtag(features.instance),
    argCountBounds: { min: 0, max: 3 },
    names: ['pardon'],
    otherSubtags: [userIdSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptSubtagMock(userIdSubtag, { type: UserIdSubtag });
    },
    cases: [
        {
            code: '{pardon}',
            expected: '0',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup(m => m.query(bbctx, '', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.pardonUser($({ guildId: ctx.guild.id, targetId: userId, moderatorId: ctx.users.command.id, count: 1, reason: 'Tag Pardon' })))
                    .mustHappen(1)
                    .resolves(0);
            }
        },
        {
            code: '{pardon}',
            expected: '5',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup(m => m.query(bbctx, '', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.pardonUser($({ guildId: ctx.guild.id, targetId: userId, moderatorId: ctx.users.command.id, count: 1, reason: 'Tag Pardon' })))
                    .mustHappen(1)
                    .resolves(5);
            }
        },
        {
            code: '{pardon;}',
            expected: '3',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup(m => m.query(bbctx, '', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.pardonUser($({ guildId: ctx.guild.id, targetId: userId, moderatorId: ctx.users.command.id, count: 1, reason: 'Tag Pardon' })))
                    .mustHappen(1)
                    .resolves(3);
            }
        },
        {
            code: '{pardon;other user}',
            expected: '7',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup(m => m.query(bbctx, 'other user', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.pardonUser($({ guildId: ctx.guild.id, targetId: userId, moderatorId: ctx.users.command.id, count: 1, reason: 'Tag Pardon' })))
                    .mustHappen(1)
                    .resolves(7);
            }
        },
        {
            code: '{pardon;;6}',
            expected: '26',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup(m => m.query(bbctx, '', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.pardonUser($({ guildId: ctx.guild.id, targetId: userId, moderatorId: ctx.users.command.id, count: 6, reason: 'Tag Pardon' })))
                    .mustHappen(1)
                    .resolves(26);
            }
        },
        {
            code: '{pardon;other user;9}',
            expected: '0',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup(m => m.query(bbctx, 'other user', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.pardonUser($({ guildId: ctx.guild.id, targetId: userId, moderatorId: ctx.users.command.id, count: 9, reason: 'Tag Pardon' })))
                    .mustHappen(1)
                    .resolves(0);
            }
        },
        {
            code: '{pardon;;;My custom reason}',
            expected: '16',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup(m => m.query(bbctx, '', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.pardonUser($({ guildId: ctx.guild.id, targetId: userId, moderatorId: ctx.users.command.id, count: 1, reason: 'My custom reason' })))
                    .mustHappen(1)
                    .resolves(16);
            }
        },
        {
            code: '{pardon;other user;6;My custom reason}',
            expected: '6',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup(m => m.query(bbctx, 'other user', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.pardonUser($({ guildId: ctx.guild.id, targetId: userId, moderatorId: ctx.users.command.id, count: 6, reason: 'My custom reason' })))
                    .mustHappen(1)
                    .resolves(6);
            }
        },
        {
            code: '{pardon;unknown user}',
            expected: '`No user found`',
            errors: [
                { error: new UserNotFoundError('unknown user') }
            ],
            postSetup(bbctx) {
                userIdSubtag.setup(m => m.query(bbctx, 'unknown user', undefined))
                    .resolves(undefined)
                    .mustHappen(1);
            }
        },
        {
            code: '{pardon;other user;abc}',
            expected: '`Not a number`',
            errors: [
                { error: new NotANumberError('abc') }
            ],
            postSetup(bbctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup(m => m.query(bbctx, 'other user', undefined))
                    .resolves(userId)
                    .mustHappen(1);
            }
        }
    ]
});
