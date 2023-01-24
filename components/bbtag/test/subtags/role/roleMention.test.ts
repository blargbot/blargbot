import { Subtag } from '@blargbot/bbtag';
import { RoleMentionSubtag } from '@blargbot/bbtag/subtags/role/roleMention.js';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(RoleMentionSubtag),
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
                        chai.expect(ctx.data.allowedMentions.roles).to.include('89176598273912362713');
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
                chai.expect(bbctx.data.allowedMentions.roles).to.deep.equal(['347865137576334534']);
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
                chai.expect(bbctx.data.allowedMentions.roles).to.deep.equal([]);
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
                chai.expect(bbctx.data.allowedMentions.roles).to.deep.equal(['347865137576334534']);
            }
        }
    ]
});
