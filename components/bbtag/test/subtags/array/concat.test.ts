import { Subtag } from '@blargbot/bbtag';
import { ConcatSubtag, GetSubtag } from '@blargbot/bbtag/subtags';
import { TagVariableType } from '@blargbot/domain/models/index.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ConcatSubtag),
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        { code: '{concat;["this", "is"];["an", "array"]}', expected: '["this","is","an","array"]' },
        { code: '{concat;a;b;c;[1, 2, 3]}', expected: '["a","b","c",1,2,3]' },
        {
            code: '{concat;{get;arr1};{get;arr2}}',
            expected: '["this","is","arr1","this","is","arr2"]',
            subtags: [Subtag.getDescriptor(GetSubtag)],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr2' }, ['this', 'is', 'arr2']);
            }
        }
    ]
});
