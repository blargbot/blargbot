import { Subtag } from '@blargbot/bbtag';
import { RoleMembersSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(RoleMembersSubtag),
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
                    postSetup(role, bbctx, ctx) {
                        role.id = '92348672342308424';
                        ctx.userService.setup(m => m.getAll(bbctx)).thenResolve(Object.values(ctx.users));
                    }
                },
                {
                    expected: '["23908467240974"]',
                    postSetup(role, bbctx, ctx) {
                        role.id = '29384723084374304';
                        ctx.users.other.id = '23908467240974';
                        ctx.users.other.member.roles.push(role.id);
                        ctx.userService.setup(m => m.getAll(bbctx)).thenResolve(Object.values(ctx.users));
                    }
                },
                {
                    expected: '["23908467240974","98347593834657389"]',
                    postSetup(role, bbctx, ctx) {
                        role.id = '29384723084374304';
                        ctx.users.other.id = '23908467240974';
                        ctx.users.bot.id = '98347593834657389';
                        ctx.users.other.member.roles.push(role.id);
                        ctx.users.bot.member.roles.push(role.id);

                        ctx.userService.setup(m => m.getAll(bbctx)).thenResolve(Object.values(ctx.users));
                    }
                }
            ]
        })
    ]
});
