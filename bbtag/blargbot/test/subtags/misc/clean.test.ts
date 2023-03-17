import { CleanSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: CleanSubtag,
    argCountBounds: { min: 1, max: 1 },
    cases: [
        { code: '{clean;Hello!  \n\n\t\t  Im     here    to help}', expected: 'Hello!\nIm here to help' },
        { code: '{clean;Hello!  \n\n-\t\t  Im     here    to help}', expected: 'Hello!\n-\tIm here to help' }
    ]
});
