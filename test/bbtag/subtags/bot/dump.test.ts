import type { GenerateDumpLinkFeature } from '@blargbot/bbtag-engine/subtags';
import { DumpSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<GenerateDumpLinkFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new DumpSubtag(features.instance),
    argCountBounds: { min: 1, max: 1 },
    names: ['dump'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        {
            code: '{dump;abc123}',
            expected: 'https://blargbot.xyz/dumps/1271927912712712',
            setup(ctx) {
                features.setup((m, $) => m.generateDumpLink($({ content: 'abc123', channelId: ctx.channelId })))
                    .resolves(new URL('https://blargbot.xyz/dumps/1271927912712712'))
                    .mustHappen(1);
            }
        }
    ]
});
