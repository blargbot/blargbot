import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { EscapeBbtagSubtag } from '@cluster/subtags/misc/escapebbtag';
import { HtmlEncodeSubtag } from '@cluster/subtags/misc/htmlencode';

import { runSubtagTests, TestError } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new HtmlEncodeSubtag(),
    cases: [
        {
            code: '{htmlencode}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 12, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        {
            code: '{htmlencode;<p>Hello & welcome! Im your host, Blargbot!</p>}',
            expected: '&lt;p&gt;Hello &amp; welcome! Im your host, Blargbot!&lt;/p&gt;',
            subtags: [new EscapeBbtagSubtag()]
        },
        {
            code: '{htmlencode;{escapebbtag;<p>Hello & welcome! Im your host;\u00a0 Blargbot!</p>}}',
            expected: '&lt;p&gt;Hello &amp; welcome! Im your host;\u00a0 Blargbot!&lt;/p&gt;',
            subtags: [new EscapeBbtagSubtag()]
        },
        {
            code: '{htmlencode;{error};{error}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 12, end: 19, error: new TestError(12) },
                { start: 20, end: 27, error: new TestError(20) },
                { start: 0, end: 28, error: new TooManyArgumentsError(1, 2) }
            ]
        }
    ]
});
