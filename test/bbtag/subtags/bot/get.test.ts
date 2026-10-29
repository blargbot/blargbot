import type { Variables, VariablesProvider } from '@blargbot/bbtag';
import { BBTagRuntimeError, NotANumberError } from '@blargbot/bbtag';
import { GetSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import type { SubtagTestCase } from '../SubtagTestSuite.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

await runSubtagTests({
    subtag: new GetSubtag({
        variables: variablesProvider.instance
    }),
    argCountBounds: { min: 1, max: 2 },
    names: ['get'],
    setup(ctx) {
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
        variablesProvider.setup(m => m.forContext(ctx.bbtag)).returns(variables.instance);
    },
    cases: [
        ...generateTestCases([
            { args: ['myVariableName'], value: undefined, expected: '' },
            { args: ['myVariableName'], value: null, expected: '' },
            { args: ['myVariableName'], value: 123, expected: '123' },
            { args: ['myVariableName'], value: true, expected: 'true' },
            { args: ['myVariableName'], value: false, expected: 'false' },
            { args: ['myVariableName'], value: { abc: 123 }, expected: '{"abc":123}' },
            { args: ['myVariableName'], value: 'LOCAL_TAG value', expected: 'LOCAL_TAG value' },
            { args: ['~myVariableName'], value: 'TEMP value', expected: 'TEMP value' },
            { args: ['*myVariableName'], value: 'GLOBAL value', expected: 'GLOBAL value' },
            { args: ['@myVariableName'], value: 'AUTHOR value', expected: 'AUTHOR value' },
            { args: ['_myVariableName'], value: 'GUILD_TAG value', expected: 'GUILD_TAG value' },
            { args: ['myVariableName'], value: 'LOCAL_TAG value', expected: 'LOCAL_TAG value' },
            { args: ['*myVariableName'], value: ['a', 'b', 'c'], expected: '{"v":["a","b","c"],"n":"*myVariableName"}' },
            { args: ['*myVariableName', '0'], value: ['a', 'b', 'c'], expected: 'a' },
            { args: ['*myVariableName', '1'], value: ['a', 'b', 'c'], expected: 'b' },
            { args: ['*myVariableName', '2'], value: ['a', 'b', 'c'], expected: 'c' },
            { args: ['*myVariableName', '2'], value: 'This isnt an array', expected: 'This isnt an array' },
            { args: ['*myVariableName', 'abc'], value: 'This isnt an array', expected: 'This isnt an array' }
        ]),
        {
            code: '{get;*myVariableName;abc}',
            expected: '`Not a number`',
            errors: [
                { error: new NotANumberError('abc') }
            ],
            setup() {
                variables.setup(m => m.get('*myVariableName')).resolves({ key: 'foo', value: [1, 2, 3] }).mustHappen(1);
            }
        },
        {
            code: '{get;*myVariableName;4}',
            expected: '`Index out of range`',
            errors: [
                { error: new BBTagRuntimeError('Index out of range') }
            ],
            setup() {
                variables.setup(m => m.get('*myVariableName')).resolves({ key: 'foo', value: [1, 2, 3] }).mustHappen(1);
            }
        },
        {
            code: '{get;*myVariableName;-1}',
            expected: '`Index out of range`',
            errors: [
                { error: new BBTagRuntimeError('Index out of range') }
            ],
            setup() {
                variables.setup(m => m.get('*myVariableName')).resolves({ key: 'foo', value: [1, 2, 3] }).mustHappen(1);
            }
        }
    ]
});

function* generateTestCases(cases: Array<{ args: string[]; value: JToken | undefined; expected: string; }>): Generator<SubtagTestCase> {
    for (const { args, value, expected } of cases) {
        const code = `{${['get', ...args].join(';')}}`;
        yield {
            title: 'Non forced',
            code: code,
            expected,
            setup() {
                variables.setup(m => m.get(args[0])).resolves({ key: args[0], value }).mustHappen(1);
            }
        };
        yield {
            title: 'Forced',
            code: `{${['get', `!${args[0]}`, ...args.slice(1)].join(';')}}`,
            expected,
            setup() {
                variables.setup(m => m.get(`!${args[0]}`)).resolves({ key: args[0], value }).mustHappen(1);
            }
        };
    }
}
