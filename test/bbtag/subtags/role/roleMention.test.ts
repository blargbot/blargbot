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
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['rolemention', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '<dynamic mention>',
                    setup(roleId) {
                        this.expected = `<@&${roleId}>`;
                    },
                    assert(_, roleId, ctx) {
                        assert.deepEqual(ctx.root.allowedMentions.roles, new Set([roleId]));
                    }
                }
            ]
        }),
        ...createGetRolePropTestCases({
            quiet: '',
            queryOptions: noLookup => ({ noLookup }),
            generateCode(roleStr, quiet) {
                return `{${['rolemention', roleStr, quiet, 'true'].join(';')}}`;
            },
            cases: [
                {
                    expected: '<dynamic mention>',
                    setup(roleId) {
                        this.expected = `<@&${roleId}>`;
                    },
                    assert(_, __, ctx) {
                        assert.deepEqual(ctx.root.allowedMentions.roles, new Set([]));
                    }
                }
            ]
        }),
        ...createGetRolePropTestCases({
            quiet: '',
            queryOptions: noLookup => ({ noLookup }),
            generateCode(roleStr, quiet) {
                return `{${['rolemention', roleStr, quiet, 'false'].join(';')}}`;
            },
            cases: [
                {
                    expected: '<dynamic mention>',
                    setup(roleId) {
                        this.expected = `<@&${roleId}>`;
                    },
                    assert(_, roleId, ctx) {
                        assert.deepEqual(ctx.root.allowedMentions.roles, new Set([roleId]));
                    }
                }
            ]
        })
    ]
});
