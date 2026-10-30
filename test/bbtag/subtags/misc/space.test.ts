import { NotANumberError } from '@blargbot/bbtag-engine';
import { SpaceSubtag } from '@blargbot/bbtag-engine/subtags';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new SpaceSubtag(),
    argCountBounds: { min: 0, max: 1 },
    names: ['space', 's'],
    cases: [
        { code: '{space}', expected: ' ' },
        { code: '{space;}', expected: ' ' },
        { code: '{space;0}', expected: '' },
        { code: '{space;-1}', expected: '' },
        { code: '{space;-5}', expected: '' },
        { code: '{space;7}', expected: '       ' },
        {
            code: '{space;{eval}aaa}',
            expected: '`Not a number`',
            errors: [
                { start: 7, end: 13, error: new MarkerError('eval', 7) },
                { error: new NotANumberError('aaa') }
            ]
        }
    ]
});
