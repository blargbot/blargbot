import { CleanSubtag } from '@blargbot/bbtag/subtags/misc/clean';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new CleanSubtag(),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        { code: '{clean;Hello!  \n\n\t\t  Im     here    to help}', expected: 'Hello!\nIm here to help' },
        { code: '{clean;Hello!  \n\n-\t\t  Im     here    to help}', expected: 'Hello!\n-\tIm here to help' }
    ]
});
