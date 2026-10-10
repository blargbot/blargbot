import { replacers, RoleNotFoundError } from '@blargbot/bbtag-engine';

import { randomSnowflake } from '../../randomSnowflake.js';
import { runSubtagTests } from '../../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.roleSizeReplacer,
    names: ['roleSize', 'inRole'],
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{rolesize;923678462837432}',
            expected: '10',
            setup(ctx) {
                const roleId = randomSnowflake('roleId');
                ctx.discord.setup((m, $) => m.queryRole('923678462837432', $({ quiet: true, throw: RoleNotFoundError }))).resolves(roleId).mustHappen(1);
                ctx.discord.setup(m => m.getRoleMemberCount(roleId)).resolves(10).mustHappen(1);
            }
        },
        {
            code: '{rolesize;923678462837432}',
            expected: '`No role found`',
            errors: [
                { error: new RoleNotFoundError('923678462837432') }
            ],
            setup(ctx) {
                ctx.discord.setup((m, $) => m.queryRole('923678462837432', $({ quiet: true, throw: RoleNotFoundError })))
                    .rejects(new RoleNotFoundError('923678462837432'))
                    .mustHappen(1);
            }
        }
    ]
});
