import { RoleSizeSubtag } from '@blargbot/bbtag/subtags/role/rolesize';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetRolePropTestCases } from './_getRolePropTest';

runSubtagTests({
    subtag: new RoleSizeSubtag(),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        ...createGetRolePropTestCases({
            quiet: false,
            generateCode(...args) {
                return `{${[`rolesize`, ...args].join(`;`)}}`;
            },
            cases: [
                {
                    expected: `0`,
                    setup(role) {
                        role.id = `92348672342308424`;
                    },
                    postSetup(_, bbctx, ctx) {
                        ctx.util.setup(m => m.ensureMemberCache(bbctx.guild)).thenResolve(undefined);
                    }
                },
                {
                    expected: `1`,
                    setup(role, ctx) {
                        role.id = `29384723084374304`;
                        ctx.users.other.id = `23908467240974`;
                        ctx.members.other.roles.push(role.id);
                    },
                    postSetup(_, bbctx, ctx) {
                        ctx.util.setup(m => m.ensureMemberCache(bbctx.guild)).thenResolve(undefined);
                    }
                },
                {
                    expected: `2`,
                    setup(role, ctx) {
                        role.id = `29384723084374304`;
                        ctx.users.other.id = `23908467240974`;
                        ctx.users.bot.id = `98347593834657389`;
                        ctx.members.other.roles.push(role.id);
                        ctx.members.bot.roles.push(role.id);
                    },
                    postSetup(_, bbctx, ctx) {
                        ctx.util.setup(m => m.ensureMemberCache(bbctx.guild)).thenResolve(undefined);
                    }
                }
            ]
        })
    ]
});
