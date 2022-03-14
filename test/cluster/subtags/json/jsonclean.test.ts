import { JsonSubtag } from '@cluster/subtags/json/json';
import { JsonCleanSubtag } from '@cluster/subtags/json/jsonclean';
import { SubtagVariableType } from '@core/types';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new JsonCleanSubtag(),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{jsonclean;{j;{"test":"[]"}}}',
            expected: '{"test":[]}',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonclean;{j;{"test":"[\\"{}\\"]"}}}',
            expected: '{"test":[{}]}',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonclean;{j;["test","[\\"{}\\"]"]}}',
            expected: '["test",[{}]]',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonclean;{j;{"n":"arr1","v":["abc","{\\"x\\":\\"5\\"}"]}}}',
            expected: '["abc",{"x":"5"}]',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonclean;arr1}',
            expected: '[{"x":{}}]',
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.arr1`] = ['{"x":"{}"}'];
            }
        },
        {
            code: '{jsonclean;obj1}',
            expected: '{"a":{"x":{}}}',
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.obj1`] = { a: '{"x":"{}"}' };
            }
        },
        {
            code: '{jsonclean;var1}',
            expected: '{"a":{"x":{}}}',
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.var1`] = '{"a":"{\\"x\\":\\"{}\\"}"}';
            }
        },
        {
            code: '{jsonclean;abc}',
            expected: '{}'
        }
    ]
});
