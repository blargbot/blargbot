import { Subtag } from '@bbtag/blargbot';
import { Md5Subtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(Md5Subtag),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        { code: '{md5;some cool text here}', expected: 'dc15a13d3e070e8151301f4430d214e7' }
    ]
});
