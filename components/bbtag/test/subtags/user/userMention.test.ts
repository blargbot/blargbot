import type { Entities } from '@bbtag/blargbot';
import { Subtag } from '@bbtag/blargbot';
import { UserMentionSubtag } from '@bbtag/blargbot/subtags';
import { argument } from '@blargbot/test-util/mock.js';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(UserMentionSubtag),
    argCountBounds: { min: 0, max: 3 },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['usermention', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '<@12345678900987236>',
                    setup(member) {
                        member.id = '12345678900987236';
                    },
                    assert(_, __, ctx) {
                        chai.expect(ctx.data.allowedMentions.users).to.deep.equal(['12345678900987236']);
                    }
                },
                {
                    expected: '<@098765434512212678>',
                    setup(member) {
                        member.id = '098765434512212678';
                    },
                    assert(_, __, ctx) {
                        chai.expect(ctx.data.allowedMentions.users).to.deep.equal(['098765434512212678']);
                    }
                },
                {
                    expected: '<@876543456778367654>',
                    setup(member) {
                        member.id = '876543456778367654';
                    },
                    assert(_, __, ctx) {
                        chai.expect(ctx.data.allowedMentions.users).to.deep.equal(['876543456778367654']);
                    }
                }
            ]
        }),
        {
            code: '{usermention;12345678900987236;;false}',
            expected: '<@12345678900987236>',
            setup(ctx) {
                ctx.users.command.id = '12345678900987236';
            },
            assert(ctx) {
                chai.expect(ctx.data.allowedMentions.users).to.deep.equal(['12345678900987236']);
            }
        },
        {
            code: '{usermention;12345678900987236;;true}',
            expected: '<@12345678900987236>',
            setup(ctx) {
                ctx.users.command.id = '12345678900987236';
            },
            assert(ctx) {
                chai.expect(ctx.data.allowedMentions.users).to.deep.equal([]);
            }
        },
        {
            code: '{usermention;12345678900987236}{usermention;12345678900987236}',
            expected: '<@12345678900987236><@12345678900987236>',
            setup(ctx) {
                ctx.users.command.id = '12345678900987236';
            },
            assert(ctx) {
                chai.expect(ctx.data.allowedMentions.users).to.deep.equal(['12345678900987236']);
            }
        },
        {
            code: '{usermention;12345678900987236}{usermention;98765434512212678}',
            expected: '<@12345678900987236><@98765434512212678>',
            setup(ctx) {
                ctx.users.command.id = '12345678900987236';
                ctx.users.other.id = '98765434512212678';
            },
            postSetup(bbctx, ctx) {
                const user = ctx.createMock<Entities.User>();
                ctx.userService.setup(m => m.querySingle(bbctx, '98765434512212678', argument.isDeepEqual({ noLookup: false }))).verifiable(1).thenResolve(user.instance);
                user.setup(m => m.id).thenReturn('98765434512212678');
            },
            assert(ctx) {
                chai.expect(ctx.data.allowedMentions.users).to.deep.equal(['12345678900987236', '98765434512212678']);
            }
        }
    ]
});
