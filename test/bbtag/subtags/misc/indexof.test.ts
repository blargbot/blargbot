import { NotANumberError } from '@blargbot/bbtag/errors';
import { EscapeBbtagSubtag } from '@blargbot/bbtag/subtags/misc/escapebbtag';
import { IndexOfSubtag } from '@blargbot/bbtag/subtags/misc/indexof';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new IndexOfSubtag(),
    argCountBounds: { min: 2, max: 3 },
    cases: [
        { code: '{indexof;This is some text;s}', expected: '3' },
        { code: '{indexof;This is some text;s;3}', expected: '3' },
        { code: '{indexof;This is some text;s;4}', expected: '6' },
        { code: '{indexof;This is some text;s;5}', expected: '6' },
        { code: '{indexof;This is some text;s;6}', expected: '6' },
        { code: '{indexof;This is some text;s;7}', expected: '8' },
        { code: '{indexof;This is some text;s;8}', expected: '8' },
        { code: '{indexof;This is some text;s;9}', expected: '-1' },

        {
            code: '{indexof;This is some text;s;a}',
            expected: '6',
            setup(ctx) { ctx.rootScope.fallback = '4'; }
        },
        {
            code: '{indexof;This is some text;s;a}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 31, error: new NotANumberError('a') }
            ]
        },
        {
            code: '{indexof;This is some text;s;a}',
            expected: 'b',
            setup(ctx) { ctx.rootScope.fallback = 'b'; },
            errors: [
                { start: 0, end: 31, error: new NotANumberError('a') }
            ]
        },

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
        { code: '{indexof;{escapebbtag;{"n":"abc","v":["a"]}};a}', expected: '0', subtags: [new EscapeBbtagSubtag()] }
    ]
});
