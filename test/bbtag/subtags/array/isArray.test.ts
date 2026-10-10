import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.isArrayReplacer,
    names: ['isArray'],
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
            replacers: [replacers.getReplacer],
            setup(ctx) {
                ctx.variables.setup(m => m.get('arr1')).returns({ key: '$arr1', value: ['this', 'is', 'arr1'] }).mustHappen();
            }
        }
    ]
});
