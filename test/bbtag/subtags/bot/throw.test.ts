import { BBTagRuntimeError } from '@blargbot/bbtag-engine';
import { ThrowSubtag } from '@blargbot/bbtag-engine/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new ThrowSubtag(),
    argCountBounds: { min: 0, max: 1 },
    names: ['throw'],
    cases: [
        {
            code: '{throw}',
            expected: '`A custom error occurred`',
            errors: [
                { error: new BBTagRuntimeError('A custom error occurred', 'A user defined error') }
            ]
        },
        {
            code: '{throw;abc}',
            expected: '`abc`',
            errors: [
                { error: new BBTagRuntimeError('abc', 'A user defined error') }
            ]
        }
    ]
});
