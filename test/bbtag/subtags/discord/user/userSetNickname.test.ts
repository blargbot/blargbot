import { BBTagRuntimeError, replacers, UserNotFoundError } from '@blargbot/bbtag-engine';

import { randomSnowflake } from '../../randomSnowflake.js';
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
                const userId = randomSnowflake('userId');
                ctx.discord.setup((m, $) => m.queryUser('', $({ throw: UserNotFoundError }))).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.setNickname(userId, 'abc')).resolves(true).mustHappen(1);
            }
        },
        {
            code: '{usersetnick;abc;other user}',
            expected: '',
            setup(ctx) {
                const userId = randomSnowflake('userId');
                ctx.discord.setup((m, $) => m.queryUser('other user', $({ throw: UserNotFoundError }))).resolves(userId).mustHappen(1);
                ctx.discord.setup(m => m.setNickname(userId, 'abc')).resolves(true).mustHappen(1);
            }
        },
        {
            code: '{usersetnick;abc;blargbot}',
            expected: '',
            setup(ctx) {
                const userId = randomSnowflake('userId');
                ctx.discord.setup((m, $) => m.queryUser('blargbot', $({ throw: UserNotFoundError }))).resolves(userId).mustHappen(1);
                ctx.discord.setup(m => m.setNickname(userId, 'abc')).resolves(true).mustHappen(1);
            }
        },
        {
            code: '{usersetnick;{eval};unknown user}',
            expected: '`No user found`',
            errors: [
                { start: 13, end: 19, error: new MarkerError('eval', 13) },
                { error: new UserNotFoundError('unknown user') }
            ],
            setup(ctx) {
                ctx.discord.setup((m, $) => m.queryUser('unknown user', $({ throw: UserNotFoundError }))).rejects(new UserNotFoundError('unknown user')).mustHappen(1);
            }
        },
        {
            code: '{usersetnick;abc;blargbot}',
            expected: '`Could not change nickname`',
            errors: [
                { error: new BBTagRuntimeError('Could not change nickname') }
            ],
            setup(ctx) {
                const userId = randomSnowflake('userId');
                ctx.discord.setup((m, $) => m.queryUser('blargbot', $({ throw: UserNotFoundError }))).resolves(userId).mustHappen(1);
                ctx.discord.setup(m => m.setNickname(userId, 'abc')).resolves(false).mustHappen(1);
            }
        }
    ]
});
