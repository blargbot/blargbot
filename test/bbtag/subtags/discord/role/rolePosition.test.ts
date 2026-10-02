import type { GuildRolePositionLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

await runSubtagTests({
    replacer: replacers.rolePositionReplacer,
    names: ['rolePosition', 'rolePos'],
    argCountBounds: { min: 1, max: 2 },
    cases: [
        ...createGetRolePropTestCases<GuildRolePositionLocals>({
            quiet: '',
            generateCode(...args) {
                return `{${['rolepos', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '2837643',
                    setup(ctx, roleId) {
                        ctx.discord.setup(m => m.getRolePosition(roleId)).resolves(2837643).mustHappen(1);
                    }
                },
                {
                    expected: '0',
                    setup(ctx, roleId) {
                        ctx.discord.setup(m => m.getRolePosition(roleId)).resolves(0).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
