import type { VariableStore } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.concatReplacer,
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        { code: '{concat;["this", "is"];["an", "array"]}', expected: '["this","is","an","array"]' },
        { code: '{concat;a;b;c;[1, 2, 3]}', expected: '["a","b","c",1,2,3]' },
        {
            code: '{concat;{get;arr1};{get;arr2}}',
            expected: '["this","is","arr1","this","is","arr2"]',
            replacers: [replacers.getReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('arr1')).returns({ key: '$var1', value: ['this', 'is', 'arr1'] }).mustHappen();
                variables.setup(m => m.get('arr2')).returns({ key: '$var2', value: ['this', 'is', 'arr2'] }).mustHappen();
            }
        }
    ]
});
