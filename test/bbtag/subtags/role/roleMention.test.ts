import assert from 'node:assert/strict';

import { RoleMentionSubtag } from '@blargbot/bbtag/subtags/role/roleMention.js';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

await runSubtagTests({
    subtag: new RoleMentionSubtag(),
    argCountBounds: { min: 1, max: 3 },
    cases: [
        ...createGetRolePropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['rolemention', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '<@&89176598273912362713>',
                    setup(role) {
                        role.id = '89176598273912362713';
                    },
                    assert(_, __, ctx) {
                        assert(ctx.data.allowedMentions.roles.includes('89176598273912362713'));
                    }
                }
            ]
        }),
        {
            code: '{rolemention;other role;;}',
            expected: '<@&347865137576334534>',
            setup(ctx) {
                ctx.roles.other.id = '347865137576334534';
            },
            postSetup(bbctx, ctx) {
                const role = bbctx.guild.roles.get(ctx.roles.other.id);
                if (role === undefined)
                    throw new Error('Cannot find the role under test');
                ctx.util.setup(m => m.findRoles(role.guild, 'other role'))
                    .thenResolve([role]);
            },
            assert(bbctx) {
                assert.deepEqual(bbctx.data.allowedMentions.roles, ['347865137576334534']);
            }
        },
        {
            code: '{rolemention;other role;;true}',
            expected: '<@&347865137576334534>',
            setup(ctx) {
                ctx.roles.other.id = '347865137576334534';
            },
            postSetup(bbctx, ctx) {
                const role = bbctx.guild.roles.get(ctx.roles.other.id);
                if (role === undefined)
                    throw new Error('Cannot find the role under test');
                ctx.util.setup(m => m.findRoles(role.guild, 'other role'))
                    .thenResolve([role]);
            },
            assert(bbctx) {
                assert.deepEqual(bbctx.data.allowedMentions.roles, []);
            }
        },
        {
            code: '{rolemention;other role;;false}',
            expected: '<@&347865137576334534>',
            setup(ctx) {
                ctx.roles.other.id = '347865137576334534';
            },
            postSetup(bbctx, ctx) {
                const role = bbctx.guild.roles.get(ctx.roles.other.id);
                if (role === undefined)
                    throw new Error('Cannot find the role under test');
                ctx.util.setup(m => m.findRoles(role.guild, 'other role'))
                    .thenResolve([role]);
            },
            assert(bbctx) {
                assert.deepEqual(bbctx.data.allowedMentions.roles, ['347865137576334534']);
            }
        }
    ]
});
