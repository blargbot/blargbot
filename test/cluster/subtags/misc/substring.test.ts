import { NotANumberError } from '@cluster/bbtag/errors';
import { SubstringSubtag } from '@cluster/subtags/misc/substring';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new SubstringSubtag(),
    argCountBounds: { min: 2, max: 3 },
    cases: [
        { code: '{substring;This is some text;5}', expected: 'is some text' },
        { code: '{substring;This is some text;0}', expected: 'This is some text' },
        {
            code: '{substring;This is some text;{eval}aaa}',
            expected: 'some text',
            setup(ctx) { ctx.rootScope.fallback = '8'; },
            errors: [
                { start: 29, end: 35, error: new MarkerError('eval', 29) }
            ]
        },
        {
            code: '{substring;This is some text;{eval}aaa}',
            expected: 'bbb',
            setup(ctx) { ctx.rootScope.fallback = 'bbb'; },
            errors: [
                { start: 29, end: 35, error: new MarkerError('eval', 29) },
                { start: 0, end: 39, error: new NotANumberError('aaa') }
            ]
        },
        { code: '{substring;This is some text;0;4}', expected: 'This' },
        { code: '{substring;This is some text;4;8}', expected: ' is ' },
        {
            code: '{substring;This is some text;{eval}aaa;12}',
            expected: 'some',
            setup(ctx) { ctx.rootScope.fallback = '8'; },
            errors: [
                { start: 29, end: 35, error: new MarkerError('eval', 29) }
            ]
        },
        {
            code: '{substring;This is some text;8;{eval}aaa}',
            expected: 'some',
            setup(ctx) { ctx.rootScope.fallback = '12'; },
            errors: [
                { start: 31, end: 37, error: new MarkerError('eval', 31) }
            ]
        },
        {
            code: '{substring;This is some text;{eval}aaa;{eval}bbb}',
            expected: '',
            setup(ctx) { ctx.rootScope.fallback = '12'; },
            errors: [
                { start: 29, end: 35, error: new MarkerError('eval', 29) },
                { start: 39, end: 45, error: new MarkerError('eval', 39) }
            ]
        },
        {
            code: '{substring;This is some text;8;{eval}aaa}',
            expected: 'ccc',
            setup(ctx) { ctx.rootScope.fallback = 'ccc'; },
            errors: [
                { start: 31, end: 37, error: new MarkerError('eval', 31) },
                { start: 0, end: 41, error: new NotANumberError('aaa') }
            ]
        },
        {
            code: '{substring;This is some text;{eval}aaa;{eval}bbb}',
            expected: 'ccc',
            setup(ctx) { ctx.rootScope.fallback = 'ccc'; },
            errors: [
                { start: 29, end: 35, error: new MarkerError('eval', 29) },
                { start: 39, end: 45, error: new MarkerError('eval', 39) },
                { start: 0, end: 49, error: new NotANumberError('aaa') }
            ]
        }
    ]
});
