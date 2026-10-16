import { BBTagRuntimeError } from '@blargbot/bbtag';
import { UriDecodeSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new UriDecodeSubtag(),
    argCountBounds: { min: 1, max: 1 },
    names: ['uriDecode'],
    cases: [
        { code: '{uridecode;JavaScript_%D1%88%D0%B5%D0%BB%D0%BB%D1%8B}', expected: 'JavaScript_шеллы' },
        { code: '{uridecode;search+query%20%28correct%29}', expected: 'search+query (correct)' },
        {
            code: '{uridecode;%E0%A4%A}',
            expected: '`URI malformed`',
            errors: [
                { error: new BBTagRuntimeError('URI malformed') }
            ]
        }
    ]
});
