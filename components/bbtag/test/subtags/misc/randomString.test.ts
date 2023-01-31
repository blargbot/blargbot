import { BBTagRuntimeError, NotANumberError, Subtag  } from '@blargbot/bbtag';
import { RandomStringSubtag } from '@blargbot/bbtag/subtags';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(RandomStringSubtag),
    argCountBounds: { min: 2, max: 2 },
    cases: [
        { code: '{randstr;abcdefg;5}', expected: /^([a-g])(?!\1{4})[a-g]{4}$/, retries: 5 },
        { code: '{randstr;123abc456xyz;7}', expected: /^([abcxyz1-6])(?!\1{6})[abcxyz1-6]{6}$/, retries: 5 },
        {
            code: '{randstr;123abc456xyz;b}',
            expected: /^([abcxyz1-6])(?!\1{6})[abcxyz1-6]{6}$/,
            setup(ctx) { ctx.rootScope.fallback = '7'; },
            retries: 5
        },
        {
            code: '{randstr;{eval};{eval}a}',
            expected: '`Not a number`',
            errors: [
                { start: 9, end: 15, error: new MarkerError('eval', 9) },
                { start: 16, end: 22, error: new MarkerError('eval', 16) },
                { start: 0, end: 24, error: new NotANumberError('a') }
            ]
        },
        {
            code: '{randstr;{eval};{eval}5}',
            expected: '`Not enough characters`',
            errors: [
                { start: 9, end: 15, error: new MarkerError('eval', 9) },
                { start: 16, end: 22, error: new MarkerError('eval', 16) },
                { start: 0, end: 24, error: new BBTagRuntimeError('Not enough characters') }
            ]
        },
        {
            code: '{randstr;{eval}123abc456xyz;{eval}a}',
            expected: 'b',
            setup(ctx) { ctx.rootScope.fallback = 'b'; },
            errors: [
                { start: 9, end: 15, error: new MarkerError('eval', 9) },
                { start: 28, end: 34, error: new MarkerError('eval', 28) },
                { start: 0, end: 36, error: new NotANumberError('a') }
            ]
        }
    ]
});
