import { Subtag } from '@bbtag/blargbot';
import { FunctionSubtag, IfSubtag, SubtagExistsSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(SubtagExistsSubtag),
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
            subtags: [Subtag.getDescriptor(IfSubtag)],
            code: '{subtagexists;if}',
            expected: 'true'
        },
        {
            subtags: [Subtag.getDescriptor(FunctionSubtag)],
            code: '{subtagexists;function}',
            expected: 'true'
        },
        {
            subtags: [Subtag.getDescriptor(FunctionSubtag)],
            code: '{subtagexists;func}',
            expected: 'true'
        },
        {
            code: '{subtagexists;func.abc}',
            expected: 'false',
            setup(ctx) {
                ctx.rootScope.functions['abc'] = {
                    end: { index: 0, line: 0, column: 0 },
                    start: { index: 0, line: 0, column: 0 },
                    source: '',
                    values: []
                };
            }
        }
    ]
});
