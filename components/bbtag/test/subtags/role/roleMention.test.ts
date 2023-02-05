import { Subtag } from '@bbtag/blargbot';
import { RoleMentionSubtag } from '@bbtag/blargbot/subtags';
import { argument } from '@blargbot/test-util/mock.js';
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
                    expected: '<@&89176598273362713>',
                    setup(role) {
                        role.id = '89176598273362713';
                    },
                    assert(_, __, ctx) {
                        chai.expect(ctx.data.allowedMentions.roles).to.include('89176598273362713');
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
                ctx.roleService.setup(m => m.querySingle(bbctx, 'other role', argument.isDeepEqual({ noLookup: false }))).thenResolve(ctx.roles.other);
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
                ctx.roleService.setup(m => m.querySingle(bbctx, 'other role', argument.isDeepEqual({ noLookup: false }))).thenResolve(ctx.roles.other);
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
                ctx.roleService.setup(m => m.querySingle(bbctx, 'other role', argument.isDeepEqual({ noLookup: false }))).thenResolve(ctx.roles.other);
            },
            assert(bbctx) {
                chai.expect(bbctx.data.allowedMentions.roles).to.deep.equal(['347865137576334534']);
            }
        }
    ]
});
