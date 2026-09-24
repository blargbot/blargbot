import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.subtagExistsReplacer,
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{subtagexists;subtagexists}',
            expected: 'true'
        },
        {
            code: '{subtagexists;abc}',
            expected: 'false'
        },
        {
            title: '{if} is not loaded',
            code: '{subtagexists;if}',
            expected: 'false'
        },
        {
            title: '{if} is loaded',
            replacers: [replacers.ifReplacer],
            code: '{subtagexists;if}',
            expected: 'true'
        },
        {
            code: '{subtagexists;function}',
            replacers: [replacers.functionReplacer],
            expected: 'true'
        },
        {
            code: '{subtagexists;func}',
            replacers: [replacers.functionReplacer],
            expected: 'true'
        },
        {
            code: '{subtagexists;func.abc}',
            expected: 'false',
            setup(ctx) {
                ctx.locals.setup(m => m.functions).returns({
                    ['func.abc']: {
                        end: { index: 0, line: 0, column: 0 },
                        start: { index: 0, line: 0, column: 0 },
                        source: '',
                        values: []
                    }
                });
            }
        }
    ]
});
