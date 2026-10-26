import type { GetPrefixFeature } from '@blargbot/bbtag/subtags';
import { PrefixSubtag } from '@blargbot/bbtag/subtags';
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
                features.setup(m => m.getPrefix(ctx.guild.id)).resolves(undefined).mustHappen(1);
                features.setup(m => m.defaultPrefix).returns('b!').mustHappen(1);
            }
        },
        {
            code: '{prefix}',
            expected: 'abc',
            setup(ctx) {
                features.setup(m => m.getPrefix(ctx.guild.id)).resolves('abc');
            }
        },
        {
            code: '{prefix}',
            expected: 'def',
            setup(ctx) {
                features.setup(m => m.getPrefix(ctx.guild.id)).resolves(['def', 'ghi']);
            }
        },
        {
            code: '{prefix}',
            expected: 'ghi',
            setup(ctx) {
                ctx.input.prefix = 'ghi';
            }
        }
    ]
});
