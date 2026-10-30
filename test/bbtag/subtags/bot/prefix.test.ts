import type { GetPrefixFeature } from '@blargbot/bbtag-engine/subtags';
import { PrefixSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<GetPrefixFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new PrefixSubtag(features.instance),
    argCountBounds: { min: 0, max: 0 },
    names: ['prefix'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        {
            code: '{prefix}',
            expected: 'b!',
            setup(ctx) {
                features.setup(m => m.getPrefix(ctx.guildId)).resolves(undefined).mustHappen(1);
                features.setup(m => m.defaultPrefix).returns('b!').mustHappen(1);
            }
        },
        {
            code: '{prefix}',
            expected: 'abc',
            setup(ctx) {
                features.setup(m => m.getPrefix(ctx.guildId)).resolves('abc');
            }
        },
        {
            code: '{prefix}',
            expected: 'def',
            setup(ctx) {
                features.setup(m => m.getPrefix(ctx.guildId)).resolves(['def', 'ghi']);
            }
        },
        {
            code: '{prefix}',
            expected: 'ghi',
            setup(ctx) {
                ctx.prefix = 'ghi';
            }
        }
    ]
});
