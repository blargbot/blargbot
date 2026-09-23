import { replacers } from '@blargbot/bbtag-engine';
import { $ } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.dumpReplacer,
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{dump;abc123}',
            expected: 'https://blargbot.xyz/dumps/1271927912712712',
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.generateDumpPage($.looksLike({ content: 'abc123' }), bbctx.channel)).thenResolve('1271927912712712');
                ctx.util.setup(m => m.websiteLink('dumps/1271927912712712')).thenReturn('https://blargbot.xyz/dumps/1271927912712712');
            }
        }
    ]
});
