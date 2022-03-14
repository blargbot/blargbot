import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { JsonSubtag } from '@cluster/subtags/json/json';
import { JsonSetSubtag } from '@cluster/subtags/json/jsonset';
import { SubtagVariableType } from '@core/types';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new JsonSetSubtag(),
    argCountBounds: { min: 2, max: 4 },
    cases: [
        {
            code: '{jsonset;{j;{"test": 123, "other": 456}};test}',
            expected: '{"other":456}',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonset;{j;{"test": 123, "other": 456}};somethingElse}',
            expected: '{"test":123,"other":456}',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonset;null;somethingElse}',
            expected: '{}'
        },
        {
            code: '{jsonset;"abc";somethingElse}',
            expected: '{}'
        },
        {
            code: '{jsonset;true;somethingElse}',
            expected: '{}'
        },
        {
            code: '{jsonset;123;somethingElse}',
            expected: '{}'
        },
        {
            code: '{jsonset;[123,456];somethingElse}',
            expected: '[123,456]'
        },
        {
            code: '{jsonset;[123,456];length}',
            expected: '`Invalid array length`',
            errors: [
                { start: 0, end: 26, error: new BBTagRuntimeError('Invalid array length') }
            ]
        },
        {
            code: '{jsonset;{j;{"test": 123, "other": "{\\"myProp\\":123}"}};other.myProp;10}',
            expected: '`Cannot set property myProp on "{\\"myProp\\":123}"`',
            subtags: [new JsonSubtag()],
            errors: [
                { start: 0, end: 72, error: new BBTagRuntimeError('Cannot set property myProp on "{\\"myProp\\":123}"') }
            ]
        },
        {
            code: '{jsonset;{j;{"test": 123, "other": "{\\"myProp\\":123}"}};other.myProp;10;true}',
            expected: '{"test":123,"other":{"myProp":"10"}}',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonset;jsonVar;other.myProp;10;true}',
            expected: '',
            setupSaveVariables: false,
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables[`${SubtagVariableType.LOCAL}.testTag.jsonVar`] = { test: 123, other: JSON.stringify({ myProp: 123 }) };
            },
            async assert(bbctx) {
                expect((await bbctx.variables.get('jsonVar')).value).to.deep.equal({ test: 123, other: { myProp: '10' } });
            }
        }
    ]
});
