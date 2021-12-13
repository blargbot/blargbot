import { IsCCSubtag } from '@cluster/subtags/simple/iscc';

import { SubtagTestSuite } from '../SubtagTestSuite';

new SubtagTestSuite(new IsCCSubtag())
    .addTestCase({
        code: '{iscc}',
        expected: 'true',
        setup(ctx) {
            ctx.options.isCC = true;
        }
    })
    .addTestCase({
        code: '{iscc}',
        expected: 'false',
        setup(ctx) {
            ctx.options.isCC = false;
        }
    })
    .run();
