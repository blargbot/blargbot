import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { EscapeBbtagSubtag } from '@cluster/subtags/misc/escapebbtag';
import { IndexOfSubtag } from '@cluster/subtags/misc/indexof';

import { runSubtagTests, TestError } from '../SubtagTestSuite';

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
            code: '{indexof;{error}}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 9, end: 16, error: new TestError(9) },
                { start: 0, end: 17, error: new NotEnoughArgumentsError(2, 1) }
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
            code: '{indexof;{error};{error};{error};{error}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 9, end: 16, error: new TestError(9) },
                { start: 17, end: 24, error: new TestError(17) },
                { start: 25, end: 32, error: new TestError(25) },
                { start: 33, end: 40, error: new TestError(33) },
                { start: 0, end: 41, error: new TooManyArgumentsError(3, 4) }
            ]
        }
    ]
});
