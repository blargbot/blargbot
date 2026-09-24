import type { VariableStore } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.reverseReplacer,
    argCountBounds: { min: 1, max: 1 },
    cases: [
        { code: '{reverse;abcdefg}', expected: 'gfedcba' },
        { code: '{reverse;[10,20,30,40,50,60]}', expected: '[60,50,40,30,20,10]' },
        {
            code: '{reverse;_myArray}',
            expected: 'yarrAym_'
        },
        {
            code: '{reverse;{get;_myArray}}',
            expected: '',
            replacers: [replacers.getReplacer],
            setup(ctx) {
                const variables = ctx.createMock<VariableStore>();
                ctx.locals.setup(m => m.variables).returns(variables.instance);
                variables.setup(m => m.get('_myArray')).resolves({ key: '_myArray', value: ['abc', 'def', 'ghi'] }).mustHappen();
                variables.setup((m, $) => m.set('_myArray', $(['ghi', 'def', 'abc']))).resolves().mustHappen();
            }
        }
    ]
});
