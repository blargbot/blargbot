import { BBTagRuntimeError, NotANumberError } from '@blargbot/bbtag';
import { RandomStringSubtag } from '@blargbot/bbtag/subtags';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new RandomStringSubtag(),
    argCountBounds: { min: 2, max: 2 },
    names: ['randomString', 'randStr', 'randString'],
    cases: [
        { code: '{randstr;abcdefg;5}', expected: /^([a-g])(?!\1{4})[a-g]{4}$/, retries: 5 },
        { code: '{randstr;123abc456xyz;7}', expected: /^([abcxyz1-6])(?!\1{6})[abcxyz1-6]{6}$/, retries: 5 },
        {
            code: '{randstr;123abc456xyz;b}',
            expected: /^([abcxyz1-6])(?!\1{6})[abcxyz1-6]{6}$/,
            postSetup(ctx) { ctx.root.fallback = '7'; },
            retries: 5
        },
        {
            code: '{randstr;{eval};{eval}a}',
            expected: '`Not a number`',
            errors: [
                { start: 9, end: 15, error: new MarkerError('eval', 9) },
                { start: 16, end: 22, error: new MarkerError('eval', 16) },
                { error: new NotANumberError('a') }
            ]
        },
        {
            code: '{randstr;{eval};{eval}5}',
            expected: '`Not enough characters`',
            errors: [
                { start: 9, end: 15, error: new MarkerError('eval', 9) },
                { start: 16, end: 22, error: new MarkerError('eval', 16) },
                { error: new BBTagRuntimeError('Not enough characters') }
            ]
        },
        {
            code: '{randstr;{eval}123abc456xyz;{eval}a}',
            expected: 'b',
            postSetup(ctx) { ctx.root.fallback = 'b'; },
            errors: [
                { start: 9, end: 15, error: new MarkerError('eval', 9) },
                { start: 28, end: 34, error: new MarkerError('eval', 28) },
                { error: new NotANumberError('a') }
            ]
        }
    ]
});
