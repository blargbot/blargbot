import { RoleMembersSubtag } from '@blargbot/bbtag/subtags/role/roleMembers.js';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

await runSubtagTests({
    subtag: new RoleMembersSubtag(),
    argCountBounds: { min: 1, max: 2 },
    cases: [
        ...createGetRolePropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['rolemembers', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '[]',
                    setup(role) {
                        role.id = '92348672342308424';
                    },
                    postSetup(_, bbctx, ctx) {
                        ctx.util.setup(m => m.ensureMemberCache(bbctx.guild)).thenResolve();
                    }
                },
                {
                    expected: '["23908467240974"]',
                    setup(role, ctx) {
                        role.id = '29384723084374304';
                        ctx.users.other.id = '23908467240974';
                        ctx.members.other.roles.push(role.id);
                    },
                    postSetup(_, bbctx, ctx) {
                        ctx.util.setup(m => m.ensureMemberCache(bbctx.guild)).thenResolve();
                    }
                },
                {
                    expected: '["23908467240974","98347593834657389"]',
                    setup(role, ctx) {
                        role.id = '29384723084374304';
                        ctx.users.other.id = '23908467240974';
                        ctx.users.bot.id = '98347593834657389';
                        ctx.members.other.roles.push(role.id);
                        ctx.members.bot.roles.push(role.id);
                    },
                    postSetup(_, bbctx, ctx) {
                        ctx.util.setup(m => m.ensureMemberCache(bbctx.guild)).thenResolve();
                    }
                }
            ]
        })
    ]
});
