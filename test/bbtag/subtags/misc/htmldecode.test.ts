import { EscapeBbtagSubtag } from '@blargbot/bbtag/subtags/misc/escapebbtag';
import { HtmlDecodeSubtag } from '@blargbot/bbtag/subtags/misc/htmldecode';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new HtmlDecodeSubtag(),
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        {
            code: '{htmldecode;&lt;p&gt;Hello &amp; welcome! Im your host&semi;&nbsp; Blargbot!&lt;/p&gt;}',
            expected: '<p>Hello &welcome! Im your host;\u00a0Blargbot!</p>'
        },
        {
            code: '{htmldecode;{escapebbtag;&lt;p&gt;Hello &amp; welcome! Im your host&semi;&nbsp; Blargbot!&lt;/p&gt;}}',
            expected: '<p>Hello & welcome! Im your host;\u00a0 Blargbot!</p>',
            subtags: [new EscapeBbtagSubtag()]
        }
    ]
});
