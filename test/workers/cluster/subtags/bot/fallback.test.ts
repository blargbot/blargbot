import { UnknownSubtagError } from '@cluster/bbtag/errors';
import { FallBackSubtag } from '@cluster/subtags/bot/fallback';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new FallBackSubtag(),
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{fallback}{xyz}',
            expected: '`Unknown subtag xyz`',
            errors: [
                { start: 10, end: 15, error: new UnknownSubtagError('xyz') }
            ],
            assert(ctx) {
                expect(ctx.scopes.local.fallback).to.be.undefined;
            }
        },
        {
            code: '{fallback;abc}{xyz}',
            expected: 'abc',
            errors: [
                { start: 14, end: 19, error: new UnknownSubtagError('xyz') }
            ],
            assert(ctx) {
                expect(ctx.scopes.local.fallback).to.be.undefined;
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
                expect(ctx.scopes.local.fallback).to.be.undefined;
            }
        }
    ]
});
