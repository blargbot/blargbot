import { randomUUID } from 'node:crypto';

import type { Entities } from '@blargbot/bbtag';
import { Subtag, UserNotFoundError } from '@blargbot/bbtag';
import { UserSetNickSubtag } from '@blargbot/bbtag/subtags';
import { argument } from '@blargbot/test-util/mock.js';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(UserSetNickSubtag),
    argCountBounds: { min: 1, max: 2 },
    cases: [
        {
            code: '{usersetnick;abc}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.userService.setup(m => m.edit(bbctx, ctx.users.command.id, argument.isDeepEqual({ nick: 'abc' }))).thenResolve(undefined);
            }
        },
        {
            code: '{usersetnick;abc;other user}',
            expected: '',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<Entities.User>();
                const userId = randomUUID();
                member.setup(m => m.id).thenReturn(userId);
                ctx.userService.setup(m => m.querySingle(bbctx, 'other user'))
                    .verifiable(1)
                    .thenResolve(member.instance);
                ctx.userService.setup(m => m.edit(bbctx, userId, argument.isDeepEqual({ nick: 'abc' })))
                    .verifiable(1)
                    .thenResolve();
            }
        },
        {
            code: '{usersetnick;abc;blargbot}',
            expected: '',
            postSetup(bbctx, ctx) {
                const member = ctx.createMock<Entities.User>();
                const userId = randomUUID();
                member.setup(m => m.id).thenReturn(userId);
                ctx.userService.setup(m => m.querySingle(bbctx, 'blargbot'))
                    .verifiable(1)
                    .thenResolve(member.instance);
                ctx.userService.setup(m => m.edit(bbctx, userId, argument.isDeepEqual({ nick: 'abc' })))
                    .verifiable(1)
                    .thenResolve();
            }
        },
        {
            code: '{usersetnick;{eval};unknown user}',
            expected: '`No user found`',
            errors: [
                { start: 13, end: 19, error: new MarkerError('eval', 13) },
                { start: 0, end: 33, error: new UserNotFoundError('unknown user') }
            ],
            postSetup(bbctx, ctx) {
                ctx.userService.setup(m => m.querySingle(bbctx, 'unknown user'))
                    .verifiable(1)
                    .thenResolve(undefined);
            }
        }
    ]
});
