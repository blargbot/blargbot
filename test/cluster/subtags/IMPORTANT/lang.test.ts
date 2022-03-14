import { LangSubtag } from '@blargbot/cluster/subtags/IMPORTANT/lang';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new LangSubtag(),
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
