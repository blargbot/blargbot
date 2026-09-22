import { EscapeBBTagSubtag, HtmlEncodeSubtag } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.htmlEncodeReplacer,
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{htmlencode;<p>Hello & welcome! Im your host, Blargbot!</p>}',
            expected: '&lt;p&gt;Hello &amp; welcome! Im your host, Blargbot!&lt;/p&gt;',
            subtags: [replacers.escapeBBTagReplacer]
        },
        {
            code: '{htmlencode;{escapebbtag;<p>Hello & welcome! Im your host;\u00a0 Blargbot!</p>}}',
            expected: '&lt;p&gt;Hello &amp; welcome! Im your host;\u00a0 Blargbot!&lt;/p&gt;',
            subtags: [replacers.escapeBBTagReplacer]
        }
    ]
});
