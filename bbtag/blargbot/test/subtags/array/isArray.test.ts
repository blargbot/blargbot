import { GetSubtag, IsArraySubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: IsArraySubtag,
    argCountBounds: { min: 1, max: 1 },
    cases: [
        { code: '{isarray;[1,2,3]}', expected: 'true' },
        { code: '{isarray;a}', expected: 'false' },
        { code: '{isarray;[a,b,c]}', expected: 'false' },
        { code: '{isarray;["a","b","c"]}', expected: 'true' },
        { code: '{isarray;[\'a\',\'b\',\'c\']}', expected: 'false' },
        {
            code: '{isarray;{get;arr1}}',
            expected: 'true',
            subtags: [GetSubtag],
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
            }
        }
    ]
});
