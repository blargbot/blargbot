import { UserNotFoundError } from '@blargbot/bbtag-engine';
import type { IsUserStaffFeature } from '@blargbot/bbtag-engine/subtags';
import { IsStaffSubtag, UserIdSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { createSnowflake } from '../../snowflake.js';
import { createMockSubtag, runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<IsUserStaffFeature>({ id: 'features' });
const userIdSubtag = createMockSubtag(UserIdSubtag);

await runSubtagTests({
    subtag: new IsStaffSubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['isMod', 'isStaff'],
    otherSubtags: [userIdSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(userIdSubtag);
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
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: false })))
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
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: false })))
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
            setup(ctx) {
                const userId = createSnowflake();
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: false })))
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
            setup(ctx) {
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: false })))
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
            setup(ctx) {
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: false })))
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
            setup(ctx) {
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, 'other user', $({ noLookup: true })))
                    .resolves(undefined)
                    .mustHappen(1);
            }
        }
    ]
});
