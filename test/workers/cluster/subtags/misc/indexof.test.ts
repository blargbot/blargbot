import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { EscapeBbtagSubtag } from '@cluster/subtags/misc/escapebbtag';
import { IndexOfSubtag } from '@cluster/subtags/misc/indexof';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new IndexOfSubtag(),
    cases: [
        {
            code: '{indexof}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 9, error: new NotEnoughArgumentsError(2, 0) }
            ]
        },
        {
            code: '{indexof;{eval}}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 9, end: 15, error: new MarkerError(9) },
                { start: 0, end: 16, error: new NotEnoughArgumentsError(2, 1) }
            ]
        },
        { code: '{indexof;This is some text;s}', expected: '3' },
        { code: '{indexof;This is some text;s;3}', expected: '3' },
        { code: '{indexof;This is some text;s;4}', expected: '6' },
        { code: '{indexof;This is some text;s;5}', expected: '6' },
        { code: '{indexof;This is some text;s;6}', expected: '6' },
        { code: '{indexof;This is some text;s;7}', expected: '8' },
        { code: '{indexof;This is some text;s;8}', expected: '8' },
        { code: '{indexof;This is some text;s;9}', expected: '-1' },

        { code: '{indexof;[1,2,3,4,"5",5,6];5}', expected: '4' },
        { code: '{indexof;[1,2,3,4,5,"5",6];5}', expected: '5' },
        { code: '{indexof;["a","b","c","b","e","a","g"];b}', expected: '1' },
        { code: '{indexof;["a","b","c","b","e","a","g"];b;0}', expected: '1' },
        { code: '{indexof;["a","b","c","b","e","a","g"];b;1}', expected: '1' },
        { code: '{indexof;["a","b","c","b","e","a","g"];b;2}', expected: '3' },
        { code: '{indexof;["a","b","c","b","e","a","g"];b;3}', expected: '3' },
        { code: '{indexof;["a","b","c","b","e","a","g"];b;4}', expected: '-1' },
        { code: '{indexof;["a","b","c","b","e","a","g"];c;2}', expected: '2' },

        { code: '{indexof;This is some text;z}', expected: '-1' },
        { code: '{indexof;;z}', expected: '-1' },
        { code: '{indexof;[];a}', expected: '-1' },
        { code: '{indexof;{escapebbtag;{"n":"abc","v":["a"]}};a}', expected: '0', subtags: [new EscapeBbtagSubtag()] },

        {
            code: '{indexof;{eval};{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 9, end: 15, error: new MarkerError(9) },
                { start: 16, end: 22, error: new MarkerError(16) },
                { start: 23, end: 29, error: new MarkerError(23) },
                { start: 30, end: 36, error: new MarkerError(30) },
                { start: 0, end: 37, error: new TooManyArgumentsError(3, 4) }
            ]
        }
    ]
});
