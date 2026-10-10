import type { GuildRolePermissionsLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

await runSubtagTests({
    replacer: replacers.rolePermissionsReplacer,
    names: ['rolePermissions', 'rolePerms'],
    argCountBounds: { min: 1, max: 2 },
    cases: [
        ...createGetRolePropTestCases<GuildRolePermissionsLocals>({
            quiet: '',
            generateCode(...args) {
                return `{${['roleperms', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '23178324',
                    setup(ctx, role) {
                        ctx.discord.setup(m => m.getRolePermissions(role)).resolves(23178324n).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
