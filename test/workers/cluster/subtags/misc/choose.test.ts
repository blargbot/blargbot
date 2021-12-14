import { BBTagRuntimeError, NotANumberError, NotEnoughArgumentsError } from '@cluster/bbtag/errors';
import { ChooseSubtag } from '@cluster/subtags/misc/choose';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

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
            code: '{choose;{eval}}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 8, end: 14, error: new MarkerError(8) },
                { start: 0, end: 15, error: new NotEnoughArgumentsError(2, 1) }
            ]
        },
        {
            code: '{choose;abc;{fail}}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 19, error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{choose;-1;{fail}}',
            expected: '`Choice cannot be negative`',
            errors: [
                { start: 0, end: 18, error: new BBTagRuntimeError('Choice cannot be negative') }
            ]
        },
        {
            code: '{choose;1;{fail}}',
            expected: '`Index out of range`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Index out of range') }
            ]
        },
        { code: '{choose;0;abc}', expected: 'abc' },
        { code: '{choose;0;abc;{fail}}', expected: 'abc' },
        { code: '{choose;1;{fail};abc}', expected: 'abc' },
        { code: '{choose;1;{fail};{eval}aaaa}', expected: 'aaaa', errors: [{ start: 17, end: 23, error: new MarkerError(17) }] },
        { code: '{choose;7;a;b;c;d;e;f;g;h;i;j;k;l;m;n;o;p;q;r;s;t;u;v;w;x;y;z}', expected: 'h' }
    ]
});
