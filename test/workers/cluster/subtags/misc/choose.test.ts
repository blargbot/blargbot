import { BBTagRuntimeError, NotANumberError, NotEnoughArgumentsError } from '@cluster/bbtag/errors';
import { ChooseSubtag } from '@cluster/subtags/misc/choose';

import { runSubtagTests, TestError } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ChooseSubtag(),
    cases: [
        {
            code: '{choose}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 8, error: new NotEnoughArgumentsError(2, 0) }
            ]
        },
        {
            code: '{choose;{error}}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 8, end: 15, error: new TestError(8) },
                { start: 0, end: 16, error: new NotEnoughArgumentsError(2, 1) }
            ]
        },
        {
            code: '{choose;abc;{error}}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 20, error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{choose;-1;{error}}',
            expected: '`Choice cannot be negative`',
            errors: [
                { start: 0, end: 19, error: new BBTagRuntimeError('Choice cannot be negative') }
            ]
        },
        {
            code: '{choose;1;{error}}',
            expected: '`Index out of range`',
            errors: [
                { start: 0, end: 18, error: new BBTagRuntimeError('Index out of range') }
            ]
        },
        { code: '{choose;0;abc}', expected: 'abc' },
        { code: '{choose;0;abc;{error}}', expected: 'abc' },
        { code: '{choose;1;{error};abc}', expected: 'abc' },
        { code: '{choose;1;{error};{error}}', expected: '', errors: [{ start: 18, end: 25, error: new TestError(18) }] },
        { code: '{choose;7;a;b;c;d;e;f;g;h;i;j;k;l;m;n;o;p;q;r;s;t;u;v;w;x;y;z}', expected: 'h' }
    ]
});
