import assert from 'node:assert/strict';

import { UserIdSubtag, UserMentionSubtag } from '@blargbot/bbtag/subtags';

import { createMockSubtag, runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

const userIdSubtag = createMockSubtag(UserIdSubtag);

await runSubtagTests({
    subtag: new UserMentionSubtag(),
    argCountBounds: { min: 0, max: 3 },
    names: ['userMention'],
    setup(ctx) {
        ctx.adoptMock(userIdSubtag);
    },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            queryOptions: noLookup => ({ noLookup, global: true }),
            generateCode(...args) {
                return `{${['usermention', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '<dynamic mention>',
                    setup(userId) {
                        this.expected = `<@${userId}>`;
                    },
                    assert(_, userId, ctx) {
                        assert.deepEqual(ctx.bbtag.root.allowedMentions.users, new Set([userId]));
                    }
                }
            ]
        }),
        {
            code: '{usermention;12345678900987236;;false}',
            expected: '<@12345678900987236>',
            subtags: [userIdSubtag.instance],
            setup(ctx) {
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '12345678900987236', $({ noLookup: false, global: true })))
                    .resolves('12345678900987236')
                    .mustHappen(1);
            },
            assert(ctx) {
                assert.deepEqual(ctx.bbtag.root.allowedMentions.users, new Set(['12345678900987236']));
            }
        },
        {
            code: '{usermention;12345678900987236;;true}',
            expected: '<@12345678900987236>',
            subtags: [userIdSubtag.instance],
            setup(ctx) {
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '12345678900987236', $({ noLookup: false, global: true })))
                    .resolves('12345678900987236')
                    .mustHappen(1);
            },
            assert(ctx) {
                assert.deepEqual(ctx.bbtag.root.allowedMentions.users, new Set([]));
            }
        },
        {
            code: '{usermention;12345678900987236}{usermention;12345678900987236}',
            expected: '<@12345678900987236><@12345678900987236>',
            subtags: [userIdSubtag.instance],
            setup(ctx) {
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '12345678900987236', $({ noLookup: false, global: true })))
                    .resolves('12345678900987236')
                    .mustHappen(2);
            },
            assert(ctx) {
                assert.deepEqual(ctx.bbtag.root.allowedMentions.users, new Set(['12345678900987236']));
            }
        },
        {
            code: '{usermention;12345678900987236}{usermention;098765434512212678}',
            expected: '<@12345678900987236><@098765434512212678>',
            subtags: [userIdSubtag.instance],
            setup(ctx) {
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '12345678900987236', $({ noLookup: false, global: true })))
                    .resolves('12345678900987236')
                    .mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(ctx.bbtag, '098765434512212678', $({ noLookup: false, global: true })))
                    .resolves('098765434512212678')
                    .mustHappen(1);
            },
            assert(ctx) {
                assert.deepEqual(ctx.bbtag.root.allowedMentions.users, new Set(['12345678900987236', '098765434512212678']));
            }
        }
    ]
});
