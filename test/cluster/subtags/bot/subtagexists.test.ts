import { FunctionSubtag } from '@cluster/subtags/bot/function';
import { SubtagExistsSubtag } from '@cluster/subtags/bot/subtagexists';
import { IfSubtag } from '@cluster/subtags/misc/if';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new SubtagExistsSubtag(),
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
            subtags: [new IfSubtag()],
            code: '{subtagexists;if}',
            expected: 'true'
        },
        {
            subtags: [new FunctionSubtag()],
            code: '{subtagexists;function}',
            expected: 'true'
        },
        {
            subtags: [new FunctionSubtag()],
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
