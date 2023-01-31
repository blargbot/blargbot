import { BBTagRuntimeError, NotANumberError, Subtag  } from '@blargbot/bbtag';
import { ChooseSubtag } from '@blargbot/bbtag/subtags';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ChooseSubtag),
    argCountBounds: { min: 2, max: Infinity },
    cases: [
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
        { code: '{choose;1;{fail};{eval}aaaa}', expected: 'aaaa', errors: [{ start: 17, end: 23, error: new MarkerError('eval', 17) }] },
        { code: '{choose;7;a;b;c;d;e;f;g;h;i;j;k;l;m;n;o;p;q;r;s;t;u;v;w;x;y;z}', expected: 'h' }
    ]
});
