import type { Variables, VariablesProvider } from '@blargbot/bbtag';
import { NotABooleanError, NotANumberError } from '@blargbot/bbtag';
import { IncrementSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

await runSubtagTests({
    subtag: new IncrementSubtag({
        variables: variablesProvider.instance
    }),
    argCountBounds: { min: 1, max: 3 },
    names: ['increment'],
    setup(ctx) {
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
    },
    postSetup(bbctx) {
        variablesProvider.setup(m => m.forContext(bbctx)).returns(variables.instance);
    },
    cases: [
        {
            title: 'Current = 18',
            code: '{increment;_myVariable}',
            expected: '19',
            setup() {
                variables.setup(m => m.get('_myVariable')).resolves({ key: 'foo', value: 18 }).mustHappen(1);
                variables.setup(m => m.set('_myVariable', 19)).resolves().mustHappen(1);
            }
        },
        {
            title: 'Current = 18.1',
            code: '{increment;_myVariable}',
            expected: '19',
            setup() {
                variables.setup(m => m.get('_myVariable')).resolves({ key: 'foo', value: 18.1 }).mustHappen(1);
                variables.setup(m => m.set('_myVariable', 19)).resolves().mustHappen(1);
            }
        },
        {
            title: 'Current = 18.9999',
            code: '{increment;_myVariable}',
            expected: '19',
            setup() {
                variables.setup(m => m.get('_myVariable')).resolves({ key: 'foo', value: 18.9999 }).mustHappen(1);
                variables.setup(m => m.set('_myVariable', 19)).resolves().mustHappen(1);
            }
        },
        {
            title: 'Current = \'18\'',
            code: '{increment;_myVariable}',
            expected: '19',
            setup() {
                variables.setup(m => m.get('_myVariable')).resolves({ key: 'foo', value: '18' }).mustHappen(1);
                variables.setup(m => m.set('_myVariable', 19)).resolves().mustHappen(1);
            }
        },
        {
            title: 'Current = \'abc\'',
            code: '{increment;_myVariable}',
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
            code: '{increment;_myVariable;3}',
            expected: '25',
            setup() {
                variables.setup(m => m.get('_myVariable')).resolves({ key: 'foo', value: 22 }).mustHappen(1);
                variables.setup(m => m.set('_myVariable', 25)).resolves().mustHappen(1);
            }
        },
        {
            title: 'Current = 22.1',
            code: '{increment;_myVariable;3}',
            expected: '25',
            setup() {
                variables.setup(m => m.get('_myVariable')).resolves({ key: 'foo', value: 22.1 }).mustHappen(1);
                variables.setup(m => m.set('_myVariable', 25)).resolves().mustHappen(1);
            }
        },
        {
            title: 'Current = 22',
            code: '{increment;_myVariable;3.6}',
            expected: '25',
            setup() {
                variables.setup(m => m.get('_myVariable')).resolves({ key: 'foo', value: 22 }).mustHappen(1);
                variables.setup(m => m.set('_myVariable', 25)).resolves().mustHappen(1);
            }
        },
        {
            title: 'Current = <not set>>',
            code: '{increment;_myVariable;xyz}',
            expected: '`Not a number`',
            errors: [
                { error: new NotANumberError('xyz') }
            ]
        },
        {
            title: 'Current = 16',
            code: '{increment;_myVariable;9;true}',
            expected: '25',
            setup() {
                variables.setup(m => m.get('_myVariable')).resolves({ key: 'foo', value: 16 }).mustHappen(1);
                variables.setup(m => m.set('_myVariable', 25)).resolves().mustHappen(1);
            }
        },
        {
            title: 'Current = 16.1',
            code: '{increment;_myVariable;9;true}',
            expected: '25',
            setup() {
                variables.setup(m => m.get('_myVariable')).resolves({ key: 'foo', value: 16.1 }).mustHappen(1);
                variables.setup(m => m.set('_myVariable', 25)).resolves().mustHappen(1);
            }
        },
        {
            title: 'Current = 16',
            code: '{increment;_myVariable;9.6;true}',
            expected: '25',
            setup() {
                variables.setup(m => m.get('_myVariable')).resolves({ key: 'foo', value: 16 }).mustHappen(1);
                variables.setup(m => m.set('_myVariable', 25)).resolves().mustHappen(1);
            }
        },
        {
            title: 'Current = 16',
            code: '{increment;_myVariable;9;false}',
            expected: '25',
            setup() {
                variables.setup(m => m.get('_myVariable')).resolves({ key: 'foo', value: 16 }).mustHappen(1);
                variables.setup(m => m.set('_myVariable', 25)).resolves().mustHappen(1);
            }
        },
        {
            title: 'Current = 16.1',
            code: '{increment;_myVariable;9;false}',
            expected: '25.1',
            setup() {
                variables.setup(m => m.get('_myVariable')).resolves({ key: 'foo', value: 16.1 }).mustHappen(1);
                variables.setup(m => m.set('_myVariable', 25.1)).resolves().mustHappen(1);
            }
        },
        {
            title: 'Current = 16',
            code: '{increment;_myVariable;9.6;false}',
            expected: '25.6',
            setup() {
                variables.setup(m => m.get('_myVariable')).resolves({ key: 'foo', value: 16 }).mustHappen(1);
                variables.setup(m => m.set('_myVariable', 25.6)).resolves().mustHappen(1);
            }
        },
        {
            title: 'Current = <not set>',
            code: '{increment;_myVariable;;abc}',
            expected: '`Not a boolean`',
            errors: [
                { error: new NotABooleanError('abc') }
            ]
        }
    ]
});
