import type { Entities } from '@bbtag/blargbot';
import { Subtag, UserNotFoundError } from '@bbtag/blargbot';
import { IsStaffSubtag } from '@bbtag/blargbot/subtags';
import { argument } from '@blargbot/test-util/mock.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(IsStaffSubtag),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        {
            code: '{isstaff}',
            expected: 'true',
            setup(ctx) {
                ctx.isStaff = true;
            }
        },
        {
            code: '{isstaff}',
            expected: 'false',
            setup(ctx) {
                ctx.isStaff = false;
            }
        },
        {
            code: '{isstaff;other user}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: false }))).verifiable(1).thenResolve(member.instance);
                ctx.dependencies.staff.setup(m => m.isUserStaff(member.instance))
                    .verifiable(1)
                    .thenResolve(true);
            }
        },
        {
            code: '{isstaff;other user}',
            expected: 'false',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<Entities.User>();
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: false }))).verifiable(1).thenResolve(member.instance);
                ctx.dependencies.staff.setup(m => m.isUserStaff(member.instance))
                    .verifiable(1)
                    .thenResolve(false);
            }
        },
        {
            code: '{isstaff;other user}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 20, error: new UserNotFoundError('other user') }

            ],
            postSetup(bbctx, ctx) {
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: false }))).verifiable(1).thenResolve(undefined);
            }
        },
        {
            code: '{isstaff;other user;}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 21, error: new UserNotFoundError('other user') }

            ],
            postSetup(bbctx, ctx) {
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: false }))).verifiable(1).thenResolve(undefined);
            }
        },
        {
            code: '{isstaff;other user;q}',
            expected: '',
            errors: [
                { start: 0, end: 22, error: new UserNotFoundError('other user').withDisplay('') }
            ],
            postSetup(bbctx, ctx) {
                ctx.dependencies.users.setup(m => m.querySingle(bbctx.runtime, 'other user', argument.isDeepEqual({ noLookup: true }))).verifiable(1).thenResolve(undefined);
            }
        }
    ]
});
