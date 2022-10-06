import { Md5Subtag } from '@blargbot/bbtag/subtags/misc/md5';
import { expect } from 'chai';
import { it } from 'mocha';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new Md5Subtag(),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        { code: `{md5;some cool text here}`, expected: `dc15a13d3e070e8151301f4430d214e7` }
    ],
    runOtherTests(md5) {
        it(`Should be deprecated`, () => {
            expect(md5.deprecated).to.equal(`hash`);
        });
    }
});
