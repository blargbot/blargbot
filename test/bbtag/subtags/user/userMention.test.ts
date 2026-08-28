import assert from 'node:assert/strict';

import { UserMentionSubtag } from '@blargbot/bbtag/subtags/user/userMention.js';
import * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

await runSubtagTests({
    subtag: new UserMentionSubtag(),
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
                        member.user.id = '12345678900987236';
                    },
                    assert(_, __, ctx) {
                        assert.deepEqual(ctx.data.allowedMentions.users, ['12345678900987236']);
                    }
                },
                {
                    expected: '<@098765434512212678>',
                    setup(member) {
                        member.user.id = '098765434512212678';
                    },
                    assert(_, __, ctx) {
                        assert.deepEqual(ctx.data.allowedMentions.users, ['098765434512212678']);
                    }
                },
                {
                    expected: '<@876543456782978367654>',
                    setup(member) {
                        member.user.id = '876543456782978367654';
                    },
                    assert(_, __, ctx) {
                        assert.deepEqual(ctx.data.allowedMentions.users, ['876543456782978367654']);
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
                assert.deepEqual(ctx.data.allowedMentions.users, ['12345678900987236']);
            }
        },
        {
            code: '{usermention;12345678900987236;;true}',
            expected: '<@12345678900987236>',
            setup(ctx) {
                ctx.users.command.id = '12345678900987236';
            },
            assert(ctx) {
                assert.deepEqual(ctx.data.allowedMentions.users, []);
            }
        },
        {
            code: '{usermention;12345678900987236}{usermention;12345678900987236}',
            expected: '<@12345678900987236><@12345678900987236>',
            setup(ctx) {
                ctx.users.command.id = '12345678900987236';
            },
            assert(ctx) {
                assert.deepEqual(ctx.data.allowedMentions.users, ['12345678900987236']);
            }
        },
        {
            code: '{usermention;12345678900987236}{usermention;098765434512212678}',
            expected: '<@12345678900987236><@098765434512212678>',
            setup(ctx) {
                ctx.users.command.id = '12345678900987236';
                ctx.users.other.id = '098765434512212678';
            },
            postSetup(bbctx, ctx) {
                const otherMember = ctx.createMock(eris.Member);
                const otherUser = ctx.createMock(eris.User);
                otherMember.setup(m => m.user, false).thenReturn(otherUser.instance);
                otherUser.setup(m => m.id).thenReturn('098765434512212678');
                otherUser.setup(m => m.mention).thenReturn('<@098765434512212678>');

                ctx.util.setup(m => m.getUser('098765434512212678')).verifiable(1).thenResolve(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.guild, '098765434512212678')).verifiable(1).thenResolve([otherMember.instance]);
            },
            assert(ctx) {
                assert.deepEqual(ctx.data.allowedMentions.users, ['12345678900987236', '098765434512212678']);
            }
        }
    ]
});
