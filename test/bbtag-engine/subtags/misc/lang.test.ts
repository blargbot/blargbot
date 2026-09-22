import { replacers } from '@blargbot/bbtag-engine';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.langReplacer,
    argCountBounds: { min: 1, max: 1 },
    cases: [
        { code: '{lang;}', expected: '' },
        { code: '{lang;abc}', expected: '' },
        {
            code: '{lang;{eval}}',
            expected: '',
            errors: [
                { start: 6, end: 12, error: new MarkerError('eval', 6) }
            ]
        }
    ]
});
