import { replacers } from '@blargbot/bbtag-engine';
import { encode } from 'html-entities';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.htmlEncodeReplacerFactory({
        decodeHtml: () => { throw new Error('Encoder shouldnt be using decode'); },
        encodeHtml: encode
    }),
    names: ['htmlEncode'],
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{htmlencode;<p>Hello & welcome! Im your host, Blargbot!</p>}',
            expected: '&lt;p&gt;Hello &amp; welcome! Im your host, Blargbot!&lt;/p&gt;'
        },
        {
            code: '{htmlencode;{escapebbtag;<p>Hello & welcome! Im your host;\u00a0 Blargbot!</p>}}',
            expected: '&lt;p&gt;Hello &amp; welcome! Im your host;\u00a0 Blargbot!&lt;/p&gt;',
            replacers: [replacers.escapeBBTagReplacer]
        }
    ]
});
