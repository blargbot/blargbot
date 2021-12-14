import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { EscapeBbtagSubtag } from '@cluster/subtags/misc/escapebbtag';
import { HtmlEncodeSubtag } from '@cluster/subtags/misc/htmlencode';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

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
            code: '{htmlencode;{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 12, end: 18, error: new MarkerError(12) },
                { start: 19, end: 25, error: new MarkerError(19) },
                { start: 0, end: 26, error: new TooManyArgumentsError(1, 2) }
            ]
        }
    ]
});
