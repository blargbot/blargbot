import type { HtmlEncoder, HtmlEncoderLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';
import { encode } from 'html-entities';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests<HtmlEncoderLocals>({
    replacer: replacers.htmlEncodeReplacer,
    argCountBounds: { min: 1, max: 1 },
    setup(ctx) {
        const htmlEncoder = ctx.createMock<HtmlEncoder>();
        ctx.locals.setup(m => m.htmlEncoder).returns(htmlEncoder.instance);
        // eslint-disable-next-line @typescript-eslint/unbound-method
        htmlEncoder.setup(m => m.encode).returns(encode);
    },
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
