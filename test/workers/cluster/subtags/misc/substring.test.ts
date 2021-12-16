import { NotANumberError, NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { SubstringSubtag } from '@cluster/subtags/misc/substring';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new SubstringSubtag(),
    cases: [
        {
            code: '{substring}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 11, error: new NotEnoughArgumentsError(2, 0) }
            ]
        },
        {
            code: '{substring;{eval}}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 11, end: 17, error: new MarkerError('eval', 11) },
                { start: 0, end: 18, error: new NotEnoughArgumentsError(2, 1) }
            ]
        },
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
        },
        {
            code: '{substring;{eval};{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 11, end: 17, error: new MarkerError('eval', 11) },
                { start: 18, end: 24, error: new MarkerError('eval', 18) },
                { start: 25, end: 31, error: new MarkerError('eval', 25) },
                { start: 32, end: 38, error: new MarkerError('eval', 32) },
                { start: 0, end: 39, error: new TooManyArgumentsError(3, 4) }
            ]
        }
    ]
});
