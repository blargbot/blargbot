import assert from 'node:assert/strict';

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
            assert(ctx) {
                assert.equal(ctx.local.reason, '');
            }
        },
        {
            code: '{reason;}',
            expected: '',
            assert(ctx) {
                assert.equal(ctx.local.reason, '');
            }
        },
        {
            code: '{reason;Because i can}',
            expected: '',
            assert(ctx) {
                assert.equal(ctx.local.reason, 'Because i can');
            }
        }
    ]
});
