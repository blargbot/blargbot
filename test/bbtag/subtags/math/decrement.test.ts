import type { Variables, VariablesProvider } from '@blargbot/bbtag-engine';
import { NotABooleanError, NotANumberError } from '@blargbot/bbtag-engine';
import { DecrementSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

await runSubtagTests({
    subtag: new DecrementSubtag({
        variables: variablesProvider.instance
    }),
    argCountBounds: { min: 1, max: 3 },
    names: ['decrement'],
    setup(ctx) {
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
        variablesProvider.setup(m => m.forContext(ctx.bbtag)).returns(variables.instance);
    },
    cases: [
        {
            title: 'Current = 18',
            code: '{decrement;_myVariable}',
            expected: '17',
            setup() {
                variables.setup(m => m.get('_myVariable')).resolves({ key: 'foo', value: 18 }).mustHappen(1);
                variables.setup(m => m.set('_myVariable', 17)).resolves().mustHappen(1);
            }
        },
        {
            title: 'Current = 18.1',
            code: '{decrement;_myVariable}',
            expected: '17',
            setup() {
                variables.setup(m => m.get('_myVariable')).resolves({ key: 'foo', value: 18.1 }).mustHappen(1);
                variables.setup(m => m.set('_myVariable', 17)).resolves().mustHappen(1);
            }
        },
        {
            title: 'Current = 18.9999',
            code: '{decrement;_myVariable}',
            expected: '17',
            setup() {
                variables.setup(m => m.get('_myVariable')).resolves({ key: 'foo', value: 18.9999 }).mustHappen(1);
                variables.setup(m => m.set('_myVariable', 17)).resolves().mustHappen(1);
            }
        },
        {
            title: 'Current = \'18\'',
            code: '{decrement;_myVariable}',
            expected: '17',
            setup() {
                variables.setup(m => m.get('_myVariable')).resolves({ key: 'foo', value: '18' }).mustHappen(1);
                variables.setup(m => m.set('_myVariable', 17)).resolves().mustHappen(1);
            }
        },
        {
            title: 'Current = \'abc\'',
            code: '{decrement;_myVariable}',
            expected: '`Not a number`',
            errors: [
                { error: new NotANumberError('abc') }
            ],
            setup() {
                variables.setup(m => m.get('_myVariable')).resolves({ key: 'foo', value: 'abc' }).mustHappen(1);
            }
        },
        {
            title: 'Current = 22',
            code: '{decrement;_myVariable;3}',
            expected: '19',
            setup() {
                variables.setup(m => m.get('_myVariable')).resolves({ key: 'foo', value: 22 }).mustHappen(1);
                variables.setup(m => m.set('_myVariable', 19)).resolves().mustHappen(1);
            }
        },
        {
            title: 'Current = 22.1',
            code: '{decrement;_myVariable;3}',
            expected: '19',
            setup() {
                variables.setup(m => m.get('_myVariable')).resolves({ key: 'foo', value: 22.1 }).mustHappen(1);
                variables.setup(m => m.set('_myVariable', 19)).resolves().mustHappen(1);
            }
        },
        {
            title: 'Current = 22',
            code: '{decrement;_myVariable;3.6}',
            expected: '19',
            setup() {
                variables.setup(m => m.get('_myVariable')).resolves({ key: 'foo', value: 22 }).mustHappen(1);
                variables.setup(m => m.set('_myVariable', 19)).resolves().mustHappen(1);
            }
        },
        {
            title: 'Current = <not set>',
            code: '{decrement;_myVariable;xyz}',
            expected: '`Not a number`',
            errors: [
                { error: new NotANumberError('xyz') }
            ]
        },
        {
            title: 'Current = 16',
            code: '{decrement;_myVariable;9;true}',
            expected: '7',
            setup() {
                variables.setup(m => m.get('_myVariable')).resolves({ key: 'foo', value: 16 }).mustHappen(1);
                variables.setup(m => m.set('_myVariable', 7)).resolves().mustHappen(1);
            }
        },
        {
            title: 'Current = 16.1',
            code: '{decrement;_myVariable;9;true}',
            expected: '7',
            setup() {
                variables.setup(m => m.get('_myVariable')).resolves({ key: 'foo', value: 16.1 }).mustHappen(1);
                variables.setup(m => m.set('_myVariable', 7)).resolves().mustHappen(1);
            }
        },
        {
            title: 'Current = 16',
            code: '{decrement;_myVariable;9.6;true}',
            expected: '7',
            setup() {
                variables.setup(m => m.get('_myVariable')).resolves({ key: 'foo', value: 16 }).mustHappen(1);
                variables.setup(m => m.set('_myVariable', 7)).resolves().mustHappen(1);
            }
        },
        {
            title: 'Current = 16',
            code: '{decrement;_myVariable;9;false}',
            expected: '7',
            setup() {
                variables.setup(m => m.get('_myVariable')).resolves({ key: 'foo', value: 16 }).mustHappen(1);
                variables.setup(m => m.set('_myVariable', 7)).resolves().mustHappen(1);
            }
        },
        {
            title: 'Current = 16.1',
            code: '{decrement;_myVariable;9;false}',
            expected: '7.100000000000001',
            setup() {
                variables.setup(m => m.get('_myVariable')).resolves({ key: 'foo', value: 16.1 }).mustHappen(1);
                variables.setup(m => m.set('_myVariable', 7.100000000000001)).resolves().mustHappen(1);
            }
        },
        {
            title: 'Current = 16',
            code: '{decrement;_myVariable;9.6;false}',
            expected: '6.4',
            setup() {
                variables.setup(m => m.get('_myVariable')).resolves({ key: 'foo', value: 16 }).mustHappen(1);
                variables.setup(m => m.set('_myVariable', 6.4)).resolves().mustHappen(1);
            }
        },
        {
            title: 'Current = <not set>',
            code: '{decrement;_myVariable;;abc}',
            expected: '`Not a boolean`',
            errors: [
                { error: new NotABooleanError('abc') }
            ]
        }
    ]
});
