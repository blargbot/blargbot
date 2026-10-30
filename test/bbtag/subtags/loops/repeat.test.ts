import type { Variables, VariablesProvider } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, NotANumberError } from '@blargbot/bbtag-engine';
import { GetSubtag, IfSubtag, IncrementSubtag, RepeatSubtag, ReturnSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

const sut = new RepeatSubtag();
await runSubtagTests({
    subtag: sut,
    argCountBounds: { min: { count: 2, noEval: [0] }, max: { count: 2, noEval: [0] } },
    names: ['repeat', 'loop'],
    setup(ctx) {
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
        variablesProvider.setup(m => m.forContext(ctx.bbtag)).returns(variables.instance);
    },
    cases: [
        {
            code: '{repeat;abc;10}',
            expected: 'abcabcabcabcabcabcabcabcabcabc',
            setup(ctx) {
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(10).resolves(undefined);
            }
        },
        {
            code: '{repeat;{increment;index},;8}',
            expected: '1,2,3,4,5,6,7,8,',
            subtags: [new IncrementSubtag({ variables: variablesProvider.instance })],
            setup(ctx) {
                setupVariable('index', '0', 8, [1, 2, 3, 4, 5, 6, 7, 8]);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(8).resolves(undefined);
            },
            assert() {
                Mock.verifySequence(...[1, 2, 3, 4, 5, 6, 7, 8]
                    .map(value => variables.expression(m => m.set('index', value))));
            }
        },
        {
            code: '{repeat;{fail};abc}',
            expected: '`Not a number`',
            errors: [
                { error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{repeat;{fail};-1}',
            expected: '`Can\'t be negative`',
            errors: [
                { error: new BBTagRuntimeError('Can\'t be negative') }
            ]
        },
        {
            code: '{repeat;{increment;index}{if;{get;index};==;6;{return}},;10}',
            expected: '1,2,3,4,5,6',
            subtags: [new GetSubtag({ variables: variablesProvider.instance }), new IfSubtag(), new ReturnSubtag(), new IncrementSubtag({ variables: variablesProvider.instance })],
            setup(ctx) {
                setupVariable('index', '0', 12, [1, 2, 3, 4, 5, 6]);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(6).resolves(undefined);
            },
            assert() {
                Mock.verifySequence(...[1, 2, 3, 4, 5, 6]
                    .map(value => variables.expression(m => m.set('index', value))));
            }
        },
        {
            code: '{repeat;{increment;index},;10}',
            expected: '1,2,3,4,`Too many loops`',
            errors: [
                { error: new BBTagRuntimeError('Too many loops') }
            ],
            subtags: [new IncrementSubtag({ variables: variablesProvider.instance })],
            setup(ctx) {
                setupVariable('index', '0', 4, [1, 2, 3, 4]);
                let i = 0;
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(5).invokesAsync(() => {
                    if (i++ >= 4)
                        throw new BBTagRuntimeError('Too many loops');
                    return undefined;
                });
            },
            assert() {
                Mock.verifySequence(...[1, 2, 3, 4]
                    .map(value => variables.expression(m => m.set('index', value))));
            }
        }
    ]
});

function setupVariable(name: string, initial: JToken | undefined, readCount: number, setTo: Iterable<JToken | undefined>): void {
    let current = initial;
    variables.setup(m => m.get(name)).resolves({
        key: 'foo',
        get value() {
            return current;
        }
    }).mustHappen(readCount);
    for (const value of setTo)
        variables.setup(m => m.set(name, value)).invokesAsync(() => void (current = value)).mustHappen(1);
}
