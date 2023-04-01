import { DumpSubtag } from '@bbtag/blargbot/subtags';
import { argument } from '@blargbot/test-util/mock.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: DumpSubtag,
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{dump;abc123}',
            expected: 'https://blargbot.xyz/dumps/1271927912712712',
            postSetup(bbctx, ctx) {
                ctx.inject.dump.setup(m => m.generateDumpPage(argument.isDeepEqual({ content: 'abc123' }), bbctx.runtime.channel)).thenResolve(new URL('https://blargbot.xyz/dumps/1271927912712712'));
            }
        }
    ]
});
