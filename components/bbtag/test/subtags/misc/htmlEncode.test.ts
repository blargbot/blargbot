import { Subtag } from '@blargbot/bbtag';
import { EscapeBBTagSubtag } from '@blargbot/bbtag/subtags/misc/escapeBBTag.js';
import { HtmlEncodeSubtag } from '@blargbot/bbtag/subtags/misc/htmlEncode.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(HtmlEncodeSubtag),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{htmlencode;<p>Hello & welcome! Im your host, Blargbot!</p>}',
            expected: '&lt;p&gt;Hello &amp; welcome! Im your host, Blargbot!&lt;/p&gt;',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)]
        },
        {
            code: '{htmlencode;{escapebbtag;<p>Hello & welcome! Im your host;\u00a0 Blargbot!</p>}}',
            expected: '&lt;p&gt;Hello &amp; welcome! Im your host;\u00a0 Blargbot!&lt;/p&gt;',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)]
        }
    ]
});
