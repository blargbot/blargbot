import type { GuildRoleColorLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

await runSubtagTests({
    replacer: replacers.roleColorReplacer,
    names: ['roleColor'],
    argCountBounds: { min: 1, max: 2 },
    cases: [
        ...createGetRolePropTestCases<GuildRoleColorLocals>({
            quiet: '',
            generateCode(...args) {
                return `{${['rolecolor', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '4488cc',
                    setup(ctx, roleId) {
                        ctx.discord.setup(m => m.getRoleColor(roleId)).returns(0x4488cc).mustHappen(1);
                    }
                },
                {
                    expected: '000000',
                    setup(ctx, roleId) {
                        ctx.discord.setup(m => m.getRoleColor(roleId)).returns(0).mustHappen(1);
                    }
                },
                {
                    expected: 'ffffff',
                    setup(ctx, roleId) {
                        ctx.discord.setup(m => m.getRoleColor(roleId)).returns(0xFFFFFF).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
