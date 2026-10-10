import { replacers } from '@blargbot/bbtag-engine';
import { decode } from 'html-entities';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.htmlDecodeReplacerFactory({
        decodeHtml: decode,
        encodeHtml: () => { throw new Error('Decoder shouldnt be using encode'); }
    }),
    names: ['htmlDecode'],
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        {
            code: '{htmldecode;&lt;p&gt;Hello &amp; welcome! Im your host&semi;&nbsp; Blargbot!&lt;/p&gt;}',
            expected: '<p>Hello &welcome! Im your host;\u00a0Blargbot!</p>'
        },
        {
            code: '{htmldecode;{escapebbtag;&lt;p&gt;Hello &amp; welcome! Im your host&semi;&nbsp; Blargbot!&lt;/p&gt;}}',
            expected: '<p>Hello & welcome! Im your host;\u00a0 Blargbot!</p>',
            replacers: [replacers.escapeBBTagReplacer]
        }
    ]
});
