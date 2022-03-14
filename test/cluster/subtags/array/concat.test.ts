import { ConcatSubtag } from '@blargbot/cluster/subtags/array/concat';
import { GetSubtag } from '@blargbot/cluster/subtags/bot/get';
import { SubtagVariableType } from '@blargbot/core/types';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ConcatSubtag(),
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        { code: '{concat;["this", "is"];["an", "array"]}', expected: '["this","is","an","array"]' },
        { code: '{concat;a;b;c;[1, 2, 3]}', expected: '["a","b","c",1,2,3]' },
        {
            code: '{concat;{get;arr1};{get;arr2}}',
            expected: '["this","is","arr1","this","is","arr2"]',
            subtags: [new GetSubtag()],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.arr1`] = ['this', 'is', 'arr1'];
                ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.arr2`] = ['this', 'is', 'arr2'];
            }
        }
    ]
});
