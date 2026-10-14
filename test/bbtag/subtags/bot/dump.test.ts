import { DumpSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new DumpSubtag(),
    argCountBounds: { min: 1, max: 1 },
    names: ['dump'],
    cases: [
        {
            code: '{dump;abc123}',
            expected: 'https://blargbot.xyz/dumps/1271927912712712',
            postSetup(bbctx, ctx) {
                ctx.util.setup((m, $) => m.generateDumpPage($({ content: 'abc123' }), bbctx.local.message.channel)).resolves('1271927912712712');
                ctx.util.setup(m => m.websiteLink('dumps/1271927912712712')).returns('https://blargbot.xyz/dumps/1271927912712712');
            }
        }
    ]
});
