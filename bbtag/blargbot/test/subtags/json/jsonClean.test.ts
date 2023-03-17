import { TagVariableType } from '@bbtag/blargbot';
import { JsonCleanSubtag, JsonSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: JsonCleanSubtag,
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{jsonclean;{j;{"test":"[]"}}}',
            expected: '{"test":[]}',
            subtags: [JsonSubtag]
        },
        {
            code: '{jsonclean;{j;{"test":"[\\"{}\\"]"}}}',
            expected: '{"test":[{}]}',
            subtags: [JsonSubtag]
        },
        {
            code: '{jsonclean;{j;["test","[\\"{}\\"]"]}}',
            expected: '["test",[{}]]',
            subtags: [JsonSubtag]
        },
        {
            code: '{jsonclean;{j;{"n":"arr1","v":["abc","{\\"x\\":\\"5\\"}"]}}}',
            expected: '["abc",{"x":"5"}]',
            subtags: [JsonSubtag]
        },
        {
            code: '{jsonclean;arr1}',
            expected: '[{"x":{}}]',
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['{"x":"{}"}']);
            }
        },
        {
            code: '{jsonclean;obj1}',
            expected: '{"a":{"x":{}}}',
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'obj1' }, { a: '{"x":"{}"}' });
            }
        },
        {
            code: '{jsonclean;var1}',
            expected: '{"a":{"x":{}}}',
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'var1' }, '{"a":"{\\"x\\":\\"{}\\"}"}');
            }
        },
        {
            code: '{jsonclean;abc}',
            expected: '{}'
        }
    ]
});
