import type { GetUserNameFeature } from '@blargbot/bbtag/subtags';
import { ReasonSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<GetUserNameFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new ReasonSubtag(features.instance),
    argCountBounds: { min: 0, max: 1 },
    names: ['reason'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        {
            code: '{reason}',
            expected: '',
            setup(ctx) {
                ctx.root.setupSet(m => m.reason = '').returns(true).mustHappen(1);
            }
        },
        {
            code: '{reason;}',
            expected: '',
            setup(ctx) {
                ctx.root.setupSet(m => m.reason = '').returns(true).mustHappen(1);
            }
        },
        {
            code: '{reason;Because i can}',
            expected: '',
            setup(ctx) {
                ctx.root.setupSet(m => m.reason = 'Because i can').returns(true).mustHappen(1);
            }
        }
    ]
});
