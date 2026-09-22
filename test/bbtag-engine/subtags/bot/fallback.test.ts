import assert from 'node:assert/strict';

import { replacers, UnknownSubtagError } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.fallbackReplacer,
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{fallback}{xyz}',
            expected: '`Unknown subtag xyz`',
            errors: [
                { start: 10, end: 15, error: new UnknownSubtagError('xyz') }
            ],
            assert(ctx) {
                assert.equal(ctx.scopes.local.fallback, undefined);
            }
        },
        {
            code: '{fallback;abc}{xyz}',
            expected: 'abc',
            errors: [
                { start: 14, end: 19, error: new UnknownSubtagError('xyz') }
            ],
            assert(ctx) {
                assert.equal(ctx.scopes.local.fallback, 'abc');
            }
        },
        {
            code: '{fallback;This tag failed} {abc} {fallback} {xyz}',
            expected: ' This tag failed  `Unknown subtag xyz`',
            errors: [
                { start: 27, end: 32, error: new UnknownSubtagError('abc') },
                { start: 44, end: 49, error: new UnknownSubtagError('xyz') }
            ],
            assert(ctx) {
                assert.equal(ctx.scopes.local.fallback, undefined);
            }
        }
    ]
});
