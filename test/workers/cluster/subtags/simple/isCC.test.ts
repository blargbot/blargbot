import { SubtagTestSuite } from '../SubtagTestSuite.test';

new SubtagTestSuite('iscc')
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
