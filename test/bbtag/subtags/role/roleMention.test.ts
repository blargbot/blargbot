import assert from 'node:assert/strict';

import { RoleMentionSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

await runSubtagTests({
    subtag: new RoleMentionSubtag(),
    argCountBounds: { min: 1, max: 3 },
    names: ['roleMention'],
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
                        assert.deepEqual(ctx.root.allowedMentions.roles, new Set(['89176598273912362713']));
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
                const role = bbctx.local.message.channel.guild.roles.get(ctx.roles.other.id);
                if (role === undefined)
                    throw new Error('Cannot find the role under test');
                ctx.util.setup(m => m.findRoles(role.guild, 'other role'))
                    .resolves([role]);
            },
            assert(bbctx) {
                assert.deepEqual(bbctx.root.allowedMentions.roles, new Set(['347865137576334534']));
            }
        },
        {
            code: '{rolemention;other role;;true}',
            expected: '<@&347865137576334534>',
            setup(ctx) {
                ctx.roles.other.id = '347865137576334534';
            },
            postSetup(bbctx, ctx) {
                const role = bbctx.local.message.channel.guild.roles.get(ctx.roles.other.id);
                if (role === undefined)
                    throw new Error('Cannot find the role under test');
                ctx.util.setup(m => m.findRoles(role.guild, 'other role'))
                    .resolves([role]);
            },
            assert(bbctx) {
                assert.deepEqual(bbctx.root.allowedMentions.roles, new Set([]));
            }
        },
        {
            code: '{rolemention;other role;;false}',
            expected: '<@&347865137576334534>',
            setup(ctx) {
                ctx.roles.other.id = '347865137576334534';
            },
            postSetup(bbctx, ctx) {
                const role = bbctx.local.message.channel.guild.roles.get(ctx.roles.other.id);
                if (role === undefined)
                    throw new Error('Cannot find the role under test');
                ctx.util.setup(m => m.findRoles(role.guild, 'other role'))
                    .resolves([role]);
            },
            assert(bbctx) {
                assert.deepEqual(bbctx.root.allowedMentions.roles, new Set(['347865137576334534']));
            }
        }
    ]
});
