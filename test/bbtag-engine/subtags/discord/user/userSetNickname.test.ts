import { replacers, UserNotFoundError } from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import { MarkerError, runSubtagTests } from '../../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.userSetNicknameReplacer,
    names: ['userSetNickname', 'setNickname', 'setNick', 'userSetNick'],
    argCountBounds: { min: 1, max: 2 },
    cases: [
        {
            code: '{usersetnick;abc}',
            expected: '',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.locals.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.locals.setup(m => m.setGuildMemberNickname(userId, 'abc')).resolves().mustHappen(1);
            }
        },
        {
            code: '{usersetnick;abc;other user}',
            expected: '',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.locals.setup((m, $) => m.queryUser('other user', $({ noLookup: false, throw: true }))).resolves(userId).mustHappen(1);
                ctx.locals.setup(m => m.setGuildMemberNickname(userId, 'abc')).resolves().mustHappen(1);
            }
        },
        {
            code: '{usersetnick;abc;blargbot}',
            expected: '',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.locals.setup((m, $) => m.queryUser('blargbot', $({ noLookup: false, throw: true }))).resolves(userId).mustHappen(1);
                ctx.locals.setup(m => m.setGuildMemberNickname(userId, 'abc')).resolves().mustHappen(1);
            }
        },
        {
            code: '{usersetnick;{eval};unknown user}',
            expected: '`No user found`',
            errors: [
                { start: 13, end: 19, error: new MarkerError('eval', 13) },
                { start: 0, end: 33, error: new UserNotFoundError('unknown user') }
            ],
            setup(ctx) {
                ctx.locals.setup((m, $) => m.queryUser('unknown user', $({ noLookup: false, throw: true }))).rejects(new UserNotFoundError('unknown user')).mustHappen(1);
            }
        }
    ]
});
