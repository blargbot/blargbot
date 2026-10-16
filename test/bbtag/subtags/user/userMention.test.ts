import assert from 'node:assert/strict';

import { UserMentionSubtag } from '@blargbot/bbtag/subtags';
import type * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

await runSubtagTests({
    subtag: new UserMentionSubtag(),
    argCountBounds: { min: 0, max: 3 },
    names: ['userMention'],
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
                        assert.deepEqual(ctx.root.allowedMentions.users, new Set(['12345678900987236']));
                    }
                },
                {
                    expected: '<@098765434512212678>',
                    setup(member) {
                        member.user.id = '098765434512212678';
                    },
                    assert(_, __, ctx) {
                        assert.deepEqual(ctx.root.allowedMentions.users, new Set(['098765434512212678']));
                    }
                },
                {
                    expected: '<@876543456782978367654>',
                    setup(member) {
                        member.user.id = '876543456782978367654';
                    },
                    assert(_, __, ctx) {
                        assert.deepEqual(ctx.root.allowedMentions.users, new Set(['876543456782978367654']));
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
                assert.deepEqual(ctx.root.allowedMentions.users, new Set(['12345678900987236']));
            }
        },
        {
            code: '{usermention;12345678900987236;;true}',
            expected: '<@12345678900987236>',
            setup(ctx) {
                ctx.users.command.id = '12345678900987236';
            },
            assert(ctx) {
                assert.deepEqual(ctx.root.allowedMentions.users, new Set([]));
            }
        },
        {
            code: '{usermention;12345678900987236}{usermention;12345678900987236}',
            expected: '<@12345678900987236><@12345678900987236>',
            setup(ctx) {
                ctx.users.command.id = '12345678900987236';
            },
            assert(ctx) {
                assert.deepEqual(ctx.root.allowedMentions.users, new Set(['12345678900987236']));
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
                const otherMember = ctx.createMock<eris.Member>({ id: 'otherMember' });
                const otherUser = ctx.createMock<eris.User>({ id: 'otherUser' });
                otherMember.setup(m => m.user).returns(otherUser.instance, { isFallback: true });
                otherUser.setup(m => m.id).returns('098765434512212678');
                otherUser.setup(m => m.mention).returns('<@098765434512212678>');

                ctx.util.setup(m => m.getUser('098765434512212678')).mustHappen(1).resolves(undefined);
                ctx.util.setup(m => m.findMembers(bbctx.root.message.channel.guild, '098765434512212678')).mustHappen(1).resolves([otherMember.instance]);
            },
            assert(ctx) {
                assert.deepEqual(ctx.root.allowedMentions.users, new Set(['12345678900987236', '098765434512212678']));
            }
        }
    ]
});
