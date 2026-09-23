import type { VariablesLocals, VariableStore } from '@blargbot/bbtag-engine';
import { NotABooleanError, NotANumberError, replacers } from '@blargbot/bbtag-engine';

import type { SubtagTestContext } from '../SubtagTestSuite.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.incrementReplacer,
    argCountBounds: { min: 1, max: 3 },
    cases: [
        {
            code: '{increment;_myVariable}',
            expected: '19',
            setup(ctx) { setupChange(ctx, '_myVariable', 18, 19); }
        },
        {
            code: '{increment;_myVariable}',
            expected: '19',
            setup(ctx) { setupChange(ctx, '_myVariable', 18.1, 19); }
        },
        {
            code: '{increment;_myVariable}',
            expected: '19',
            setup(ctx) { setupChange(ctx, '_myVariable', 18.9999, 19); }
        },
        {
            code: '{increment;_myVariable}',
            expected: '19',
            setup(ctx) { setupChange(ctx, '_myVariable', '18', 19); }
        },
        {
            code: '{increment;_myVariable}',
            expected: '`Not a number`',
            setup(ctx) { setupChange(ctx, '_myVariable', 'abc'); },
            errors: [
                { start: 0, end: 23, error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{increment;_myVariable;3}',
            expected: '25',
            setup(ctx) { setupChange(ctx, '_myVariable', 22, 25); }
        },
        {
            code: '{increment;_myVariable;3}',
            expected: '25',
            setup(ctx) { setupChange(ctx, '_myVariable', 22.1, 25); }
        },
        {
            code: '{increment;_myVariable;3.6}',
            expected: '25',
            setup(ctx) { setupChange(ctx, '_myVariable', 22, 25); }
        },
        {
            code: '{increment;_myVariable;xyz}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 27, error: new NotANumberError('xyz') }
            ]
        },
        {
            code: '{increment;_myVariable;9;true}',
            expected: '25',
            setup(ctx) { setupChange(ctx, '_myVariable', 16, 25); }
        },
        {
            code: '{increment;_myVariable;9;true}',
            expected: '25',
            setup(ctx) { setupChange(ctx, '_myVariable', 16.1, 25); }
        },
        {
            code: '{increment;_myVariable;9.6;true}',
            expected: '25',
            setup(ctx) { setupChange(ctx, '_myVariable', 16, 25); }
        },
        {
            code: '{increment;_myVariable;9;false}',
            expected: '25',
            setup(ctx) { setupChange(ctx, '_myVariable', 16, 25); }
        },
        {
            code: '{increment;_myVariable;9;false}',
            expected: '25.1',
            setup(ctx) { setupChange(ctx, '_myVariable', 16.1, 25.1); }
        },
        {
            code: '{increment;_myVariable;9.6;false}',
            expected: '25.6',
            setup(ctx) { setupChange(ctx, '_myVariable', 16, 25.6); }
        },
        {
            code: '{increment;_myVariable;;abc}',
            expected: '`Not a boolean`',
            errors: [
                { start: 0, end: 28, error: new NotABooleanError('abc') }
            ]
        }
    ]
});

function setupChange(ctx: SubtagTestContext<VariablesLocals>, name: string, current: JToken | undefined, setTo?: JToken): void {
    const variables = ctx.createMock<VariableStore>();
    ctx.locals.setup(m => m.variables).returns(variables.instance);
    variables.setup(m => m.get(name)).returns({ key: '$var', value: current }).mustHappen();
    if (arguments.length > 3)
        variables.setup(m => m.set(name, setTo)).returns().mustHappen();
}
