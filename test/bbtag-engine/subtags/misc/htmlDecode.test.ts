import { EscapeBBTagSubtag, HtmlDecodeSubtag } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.htmlDecodeReplacer,
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        {
            code: '{htmldecode;&lt;p&gt;Hello &amp; welcome! Im your host&semi;&nbsp; Blargbot!&lt;/p&gt;}',
            expected: '<p>Hello &welcome! Im your host;\u00a0Blargbot!</p>'
        },
        {
            code: '{htmldecode;{escapebbtag;&lt;p&gt;Hello &amp; welcome! Im your host&semi;&nbsp; Blargbot!&lt;/p&gt;}}',
            expected: '<p>Hello & welcome! Im your host;\u00a0 Blargbot!</p>',
            subtags: [replacers.escapeBBTagReplacer]
        }
    ]
});
