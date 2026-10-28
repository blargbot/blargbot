import { UserNotFoundError } from '@blargbot/bbtag';
import type { IsUserStaffFeature } from '@blargbot/bbtag/subtags';
import { IsStaffSubtag, UserIdSubtag } from '@blargbot/bbtag/subtags';
import { snowflake } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<IsUserStaffFeature>({ id: 'features' });
const userIdSubtag = new Mock<UserIdSubtag>({ id: 'UserIdSubtag' });

await runSubtagTests({
    subtag: new IsStaffSubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['isMod', 'isStaff'],
    otherSubtags: [userIdSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptSubtagMock(userIdSubtag, { type: UserIdSubtag });
    },
    cases: [
        {
            code: '{isstaff}',
            expected: 'true',
            setup(ctx) {
                features.setup(m => m.isUserStaff(ctx.guildId, ctx.authorizerId))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            code: '{isstaff},{isstaff},{isstaff}',
            expected: 'true,true,true',
            setup(ctx) {
                features.setup(m => m.isUserStaff(ctx.guildId, ctx.authorizerId))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            code: '{isstaff}',
            expected: 'false',
            setup(ctx) {
                features.setup(m => m.isUserStaff(ctx.guildId, ctx.authorizerId))
                    .resolves(false)
                    .mustHappen(1);
            }
        },
        {
            code: '{isstaff;other user}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: false })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.isUserStaff(ctx.guildId, userId))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            code: '{isstaff;other user},{isstaff;other user},{isstaff;other user}',
            expected: 'true,true,true',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: false })))
                    .resolves(userId)
                    .mustHappen(3);
                features.setup(m => m.isUserStaff(ctx.guildId, userId))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            code: '{isstaff;other user}',
            expected: 'false',
            postSetup(bbctx, ctx) {
                const userId = snowflake.create().toString();
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: false })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.isUserStaff(ctx.guildId, userId))
                    .resolves(false)
                    .mustHappen(1);
            }
        },
        {
            code: '{isstaff;other user}',
            expected: '`No user found`',
            errors: [
                { error: new UserNotFoundError('other user') }
            ],
            postSetup(bbctx) {
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: false })))
                    .resolves(undefined)
                    .mustHappen(1);
            }
        },
        {
            code: '{isstaff;other user;}',
            expected: '`No user found`',
            errors: [
                { error: new UserNotFoundError('other user') }
            ],
            postSetup(bbctx) {
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: false })))
                    .resolves(undefined)
                    .mustHappen(1);
            }
        },
        {
            code: '{isstaff;other user;q}',
            expected: '',
            errors: [
                { error: new UserNotFoundError('other user').withDisplay('') }
            ],
            postSetup(bbctx) {
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true })))
                    .resolves(undefined)
                    .mustHappen(1);
            }
        }
    ]
});
