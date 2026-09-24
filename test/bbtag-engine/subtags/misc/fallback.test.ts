import assert from 'node:assert/strict';

import type { FallbackLocals } from '@blargbot/bbtag-engine';
import { replacers, UnknownSubtagError } from '@blargbot/bbtag-engine';

import { createTestReplacer, runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.fallbackReplacer,
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{fallback}{xyz}{check1}',
            expected: '`Unknown subtag xyz`',
            errors: [
                { start: 10, end: 15, error: new UnknownSubtagError('xyz') }
            ],
            replacers: [createTestReplacer<FallbackLocals>('check1', ctx => {
                assert.equal(ctx.locals.fallback, undefined);
            })]
        },
        {
            code: '{fallback;abc}{xyz}{check1}',
            expected: 'abc',
            errors: [
                { start: 14, end: 19, error: new UnknownSubtagError('xyz') }
            ],
            replacers: [createTestReplacer<FallbackLocals>('check1', ctx => {
                assert.equal(ctx.locals.fallback, 'abc');
            })]
        },
        {
            code: '{fallback;This tag failed} {abc}{check1} {fallback} {xyz}{check2}',
            expected: ' This tag failed  `Unknown subtag xyz`',
            errors: [
                { start: 27, end: 32, error: new UnknownSubtagError('abc') },
                { start: 52, end: 57, error: new UnknownSubtagError('xyz') }
            ],
            replacers: [
                createTestReplacer<FallbackLocals>('check1', ctx => {
                    assert.equal(ctx.locals.fallback, 'This tag failed');
                }),
                createTestReplacer<FallbackLocals>('check2', ctx => {
                    assert.equal(ctx.locals.fallback, undefined);
                })
            ]
        }
    ]
});
