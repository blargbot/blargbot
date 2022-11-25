import { IsArraySubtag } from '@blargbot/bbtag/subtags/array/isArray';
import { GetSubtag } from '@blargbot/bbtag/subtags/bot/get';
import { TagVariableType } from '@blargbot/domain/models';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new IsArraySubtag(),
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
            subtags: [new GetSubtag()],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
            }
        }
    ]
});
