import { NotEnoughArgumentsError } from '@cluster/bbtag/errors';
import { EscapeBbtagSubtag } from '@cluster/subtags/misc/escapebbtag';
import { HtmlDecodeSubtag } from '@cluster/subtags/misc/htmldecode';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new HtmlDecodeSubtag(),
    cases: [
        {
            code: '{htmldecode}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 12, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        {
            code: '{htmldecode;&lt;p&gt;Hello &amp; welcome! Im your host&semi;&nbsp; Blargbot!&lt;/p&gt;}',
            expected: '<p>Hello & welcome! Im your host;\u00a0 Blargbot!</p>'
        },
        {
            code: '{htmldecode;{escapebbtag;&lt;p&gt;Hello &amp; welcome! Im your host&semi;&nbsp; Blargbot!&lt;/p&gt;}}',
            expected: '<p>Hello & welcome! Im your host;\u00a0 Blargbot!</p>',
            subtags: [new EscapeBbtagSubtag()]
        }
    ]
});
