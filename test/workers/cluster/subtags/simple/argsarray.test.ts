import { ArgsArraySubtag } from '@cluster/subtags/simple/argsarray';

import { SubtagTestSuite } from '../SubtagTestSuite';

new SubtagTestSuite(new ArgsArraySubtag())
    .addTestCase({
        code: '{argsarray}',
        expected: '[]',
        setup(ctx) {
            ctx.options.inputRaw = '';
        }
    })
    .addTestCase({
        code: '{argsarray}',
        expected: '["this","is","a","test"]',
        setup(ctx) {
            ctx.options.inputRaw = 'this is a test';
        }
    })
    .addTestCase({
        code: '{argsarray}',
        expected: '["this","is a","test"]',
        setup(ctx) {
            ctx.options.inputRaw = 'this "is a" test';
        }
    })
    .run();
