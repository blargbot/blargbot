import { BBTagRuntimeError, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.throwReplacer,
    names: ['throw'],
    argCountBounds: { min: 0, max: 1 },
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
