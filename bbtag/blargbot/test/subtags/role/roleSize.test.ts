import { RoleSizeSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

runSubtagTests({
    subtag: RoleSizeSubtag,
    argCountBounds: { min: 1, max: 1 },
    cases: [
        ...createGetRolePropTestCases({
            quiet: false,
            getQueryOptions: () => ({ noErrors: true, noLookup: true }),
            generateCode(...args) {
                return `{${['rolesize', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '0',
                    setup(role) {
                        role.id = '92348672342308424';
                    },
                    postSetup(_, bbctx, ctx) {
                        ctx.inject.users.setup(m => m.getAll(bbctx.runtime)).thenResolve(Object.values(ctx.users));
                    }
                },
                {
                    expected: '1',
                    setup(role, ctx) {
                        role.id = '29384723084374304';
                        ctx.users.other.id = '23908467240974';
                        ctx.users.other.member.roles.push(role.id);
                    },
                    postSetup(_, bbctx, ctx) {
                        ctx.inject.users.setup(m => m.getAll(bbctx.runtime)).thenResolve(Object.values(ctx.users));
                    }
                },
                {
                    expected: '2',
                    setup(role, ctx) {
                        role.id = '29384723084374304';
                        ctx.users.other.id = '23908467240974';
                        ctx.users.bot.id = '98347593834657389';
                        ctx.users.other.member.roles.push(role.id);
                        ctx.users.bot.member.roles.push(role.id);
                    },
                    postSetup(_, bbctx, ctx) {
                        ctx.inject.users.setup(m => m.getAll(bbctx.runtime)).thenResolve(Object.values(ctx.users));
                    }
                }
            ]
        })
    ]
});
