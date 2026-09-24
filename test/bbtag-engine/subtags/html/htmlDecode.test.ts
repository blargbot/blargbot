import type { HtmlEncoder, HtmlEncoderLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';
import { decode } from 'html-entities';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests<HtmlEncoderLocals>({
    replacer: replacers.htmlDecodeReplacer,
    argCountBounds: { min: 1, max: Infinity },
    setup(ctx) {
        const htmlEncoder = ctx.createMock<HtmlEncoder>();
        ctx.locals.setup(m => m.htmlEncoder).returns(htmlEncoder.instance);
        // eslint-disable-next-line @typescript-eslint/unbound-method
        htmlEncoder.setup(m => m.decode).returns(decode);
    },
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
