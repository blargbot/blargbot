import type { Variables, VariablesProvider } from '@blargbot/bbtag';
import { BBTagRuntimeError, NotAnArrayError } from '@blargbot/bbtag';
import { JsonSortSubtag, JsonSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

await runSubtagTests({
    subtag: new JsonSortSubtag({
        variables: variablesProvider.instance
    }),
    argCountBounds: { min: 2, max: 3 },
    names: ['jsonSort', 'jSort'],
    setup(ctx) {
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
        variablesProvider.setup(m => m.forContext(ctx.bbtag)).returns(variables.instance);
    },
    cases: [
        {
            code: '{jsonsort;{j;[{"points": 10, "name": "Blargbot"},{"points": 3, "name": "UNO"},{"points": 6, "name": "Stupid cat"},{"points": 12, "name": "Winner"}]};points}',
            expected: '[{"points":3,"name":"UNO"},{"points":6,"name":"Stupid cat"},{"points":10,"name":"Blargbot"},{"points":12,"name":"Winner"}]',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonsort;{j;[{"points": 10, "name": "Blargbot"},{"points": 3, "name": "UNO"},{"points": 6, "name": "Stupid cat"},{"points": 12, "name": "Winner"}]};points;a}',
            expected: '[{"points":12,"name":"Winner"},{"points":10,"name":"Blargbot"},{"points":6,"name":"Stupid cat"},{"points":3,"name":"UNO"}]',
            subtags: [new JsonSubtag()]
        },
        {
            code: '{jsonsort;arrayVar;points}',
            expected: '',
            setup() {
                variables.setup(m => m.get('arrayVar')).resolves({
                    key: 'foo',
                    value: [
                        { points: 10, name: 'Blargbot' },
                        { points: 3, name: 'UNO' },
                        { points: 6, name: 'Stupid cat' },
                        { points: 12, name: 'Winner' }
                    ]
                });
                variables.setup((m, $) => m.set('arrayVar', $([
                    { points: 3, name: 'UNO' },
                    { points: 6, name: 'Stupid cat' },
                    { points: 10, name: 'Blargbot' },
                    { points: 12, name: 'Winner' }
                ]))).resolves().mustHappen(1);
            }
        },
        {
            code: '{jsonsort;arrayVar;points;a}',
            expected: '',
            setup() {
                variables.setup(m => m.get('arrayVar')).resolves({
                    key: 'foo',
                    value: [
                        { points: 10, name: 'Blargbot' },
                        { points: 3, name: 'UNO' },
                        { points: 6, name: 'Stupid cat' },
                        { points: 12, name: 'Winner' }
                    ]
                });
                variables.setup((m, $) => m.set('arrayVar', $([
                    { points: 12, name: 'Winner' },
                    { points: 10, name: 'Blargbot' },
                    { points: 6, name: 'Stupid cat' },
                    { points: 3, name: 'UNO' }
                ]))).resolves().mustHappen(1);
            }
        },
        {
            code: '{jsonsort;arrayVar;points;a}',
            expected: '`Cannot read property points at index 1, 1 total failures`',
            errors: [
                { error: new BBTagRuntimeError('Cannot read property points at index 1, 1 total failures') }
            ],
            setup() {
                variables.setup(m => m.get('arrayVar')).resolves({
                    key: 'foo',
                    value: [
                        { points: 10, name: 'Blargbot' },
                        { test: 3, name: 'UNO' },
                        { points: 6, name: 'Stupid cat' },
                        { points: 12, name: 'Winner' }
                    ]
                });
            }
        },
        {
            code: '{jsonsort;arrayVar;abc;a}',
            expected: '`Cannot read property abc at index 0, 4 total failures`',
            errors: [
                { error: new BBTagRuntimeError('Cannot read property abc at index 0, 4 total failures') }
            ],
            setup() {
                variables.setup(m => m.get('arrayVar')).resolves({
                    key: 'foo',
                    value: [
                        { points: 10, name: 'Blargbot' },
                        { points: 3, name: 'UNO' },
                        { points: 6, name: 'Stupid cat' },
                        { points: 12, name: 'Winner' }
                    ]
                });
            }
        },
        {
            code: '{jsonsort;testVar;abc;a}',
            expected: '`Not an array`',
            errors: [
                { error: new NotAnArrayError('testVar') }
            ],
            setup() {
                variables.setup(m => m.get('testVar')).resolves({
                    key: 'foo',
                    value: 'xyz'
                });
            }
        }
    ]
});
