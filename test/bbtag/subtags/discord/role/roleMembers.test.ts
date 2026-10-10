import type { GuildRoleMembersLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

await runSubtagTests({
    replacer: replacers.roleMembersReplacer,
    names: ['roleMembers'],
    argCountBounds: { min: 1, max: 2 },
    cases: [
        ...createGetRolePropTestCases<GuildRoleMembersLocals>({
            quiet: '',
            generateCode(...args) {
                return `{${['rolemembers', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '[]',
                    setup(ctx, role) {
                        ctx.discord.setup(m => m.listRoleMembers(role)).resolves([]).mustHappen(1);
                    }
                },
                {
                    expected: '["23908467240974"]',
                    setup(ctx, role) {
                        ctx.discord.setup(m => m.listRoleMembers(role)).resolves([23908467240974n]).mustHappen(1);
                    }
                },
                {
                    expected: '["23908467240974","98347593834657389"]',
                    setup(ctx, role) {
                        ctx.discord.setup(m => m.listRoleMembers(role)).resolves([23908467240974n, 98347593834657389n]).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
