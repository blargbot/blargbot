import { EscapeBbtagSubtag } from '@blargbot/bbtag/subtags/misc/escapebbtag';
import { HtmlEncodeSubtag } from '@blargbot/bbtag/subtags/misc/htmlencode';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new HtmlEncodeSubtag(),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: `{htmlencode;<p>Hello & welcome! Im your host, Blargbot!</p>}`,
            expected: `&lt;p&gt;Hello &amp; welcome! Im your host, Blargbot!&lt;/p&gt;`,
            subtags: [new EscapeBbtagSubtag()]
        },
        {
            code: `{htmlencode;{escapebbtag;<p>Hello & welcome! Im your host;\u00a0 Blargbot!</p>}}`,
            expected: `&lt;p&gt;Hello &amp; welcome! Im your host;\u00a0 Blargbot!&lt;/p&gt;`,
            subtags: [new EscapeBbtagSubtag()]
        }
    ]
});
