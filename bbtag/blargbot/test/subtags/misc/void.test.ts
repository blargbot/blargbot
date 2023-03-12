import { Subtag } from '@bbtag/blargbot';
import { VoidSubtag } from '@bbtag/blargbot/subtags';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(VoidSubtag),
    argCountBounds: { min: 0, max: Infinity },
    cases: [
        { code: '{void}', expected: '' },
        { code: '{void;}', expected: '' },
        { code: '{void;abcdefgh}', expected: '' },
        { code: '{void;abcdefgh;ijk;m;239;sdsds}', expected: '' },
        {
            code: '{void;{eval}}',
            expected: '',
            errors: [
                { start: 6, end: 12, error: new MarkerError('eval', 6) }
            ]
        },
        {
            code: '{void;{eval};{eval};{eval};{eval}}',
            expected: '',
            errors: [
                { start: 6, end: 12, error: new MarkerError('eval', 6) },
                { start: 13, end: 19, error: new MarkerError('eval', 13) },
                { start: 20, end: 26, error: new MarkerError('eval', 20) },
                { start: 27, end: 33, error: new MarkerError('eval', 27) }
            ]
        }
    ]
});
