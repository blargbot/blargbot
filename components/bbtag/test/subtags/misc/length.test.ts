import { UnknownSubtagError } from '@blargbot/bbtag/errors';
import { EscapeBBTagSubtag } from '@blargbot/bbtag/subtags/misc/escapeBBTag';
import { LengthSubtag } from '@blargbot/bbtag/subtags/misc/length';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new LengthSubtag(),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        { code: '{length;}', expected: '0' },
        { code: '{length;abc}', expected: '3' },
        { code: '{length;This is some test text}', expected: '22' },
        { code: '{length;[]}', expected: '0' },
        {
            code: '{length;{"n":"abc","v":[]}}',
            expected: '33',
            errors: [
                { start: 8, end: 26, error: new UnknownSubtagError('"n":"abc","v":[]') }
            ]
        },
        { code: '{length;{escapebbtag;{"n":"abc","v":[]}}}', expected: '0', subtags: [new EscapeBBTagSubtag()] },
        { code: '{length;[1,2,3,4]}', expected: '4' },
        { code: '{length;["a","b","cde","f","g"]}', expected: '5' }
    ]
});
