import { Subtag } from '@blargbot/bbtag';
import { BBTagRuntimeError } from '@blargbot/bbtag/errors/index.js';
import { JsonSubtag } from '@blargbot/bbtag/subtags/json/json.js';
import { JsonGetSubtag } from '@blargbot/bbtag/subtags/json/jsonGet.js';
import { TagVariableType } from '@blargbot/domain/models/index.js';

import type { SubtagTestCase } from '../SubtagTestSuite.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(JsonGetSubtag),
    argCountBounds: { min: 1, max: 2 },
    cases: [
        ...generateTestCases({ array: [{ test: { abc: 123 } }] }, 'array.0.test', '{"abc":123}'),
        ...generateTestCases({ array: JSON.stringify([{ test: { abc: 123 } }]) }, 'array.0.test', '{"abc":123}'),
        ...generateTestCases(JSON.stringify({ array: [{ test: { abc: 123 } }] }), 'array.0.test', '{"abc":123}'),
        ...generateTestCases({ n: 'test', v: [{ test: { abc: 123 } }] }, '0.test', '{"abc":123}'),
        {
            code: '{jsonget;10;0.test}',
            expected: '`Cannot read property test of undefined`',
            errors: [
                { start: 0, end: 19, error: new BBTagRuntimeError('Cannot read property test of undefined') }
            ]
        },
        {
            code: '{jsonget;"abc";0.test}',
            expected: '`Cannot read property test of undefined`',
            errors: [
                { start: 0, end: 22, error: new BBTagRuntimeError('Cannot read property test of undefined') }
            ]
        },
        {
            code: '{jsonget;true;0.test}',
            expected: '`Cannot read property test of undefined`',
            errors: [
                { start: 0, end: 21, error: new BBTagRuntimeError('Cannot read property test of undefined') }
            ]
        },
        {
            code: '{jsonget;;someProp}',
            expected: ''
        }
    ]
});

function* generateTestCases(source: JToken, path: string, expected: string): Iterable<SubtagTestCase> {
    yield {
        code: `{jsonget;{j;${JSON.stringify(source)}};${path}}`,
        subtags: [Subtag.getDescriptor(JsonSubtag)],
        expected: expected
    };
    yield {
        code: `{jsonget;myJsonVar;${path}}`,
        expected: expected,
        setup(ctx) {
            ctx.options.tagName = 'testTag';
            ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'myJsonVar' }, source);
        }
    };
    yield {
        code: '{jsonget;myJsonVar}',
        expected: typeof source === 'string' ? source : JSON.stringify(source),
        setup(ctx) {
            ctx.options.tagName = 'testTag';
            ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'myJsonVar' }, source);
        }
    };
}
