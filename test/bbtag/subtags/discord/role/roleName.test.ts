import type { GuildRoleNameLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

await runSubtagTests({
    replacer: replacers.roleNameReplacer,
    names: ['roleName'],
    argCountBounds: { min: 1, max: 2 },
    cases: [
        ...createGetRolePropTestCases<GuildRoleNameLocals>({
            quiet: '',
            generateCode(...args) {
                return `{${['rolename', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'abcdef',
                    setup(ctx, role) {
                        ctx.discord.setup(m => m.getRoleName(role)).resolves('abcdef').mustHappen(1);
                    }
                }
            ]
        })
    ]
});
