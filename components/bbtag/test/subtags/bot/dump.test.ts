import { Subtag } from '@blargbot/bbtag';
import { DumpSubtag } from '@blargbot/bbtag/subtags';
import { argument } from '@blargbot/test-util/mock.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(DumpSubtag),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{dump;abc123}',
            expected: 'https://blargbot.xyz/dumps/1271927912712712',
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.generateDumpPage(argument.isDeepEqual({ content: 'abc123' }), bbctx.channel)).thenResolve('1271927912712712');
                ctx.util.setup(m => m.websiteLink('dumps/1271927912712712')).thenReturn('https://blargbot.xyz/dumps/1271927912712712');
            }
        }
    ]
});
