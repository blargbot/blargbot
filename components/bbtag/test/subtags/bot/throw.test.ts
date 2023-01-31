import { BBTagRuntimeError, Subtag  } from '@blargbot/bbtag';
import { ThrowSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ThrowSubtag),
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{throw}',
            expected: '`A custom error occurred`',
            errors: [
                { start: 0, end: 7, error: new BBTagRuntimeError('A custom error occurred', 'A user defined error') }
            ]
        },
        {
            code: '{throw;abc}',
            expected: '`abc`',
            errors: [
                { start: 0, end: 11, error: new BBTagRuntimeError('abc', 'A user defined error') }
            ]
        }
    ]
});