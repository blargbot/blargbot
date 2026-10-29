import type { Variables, VariablesProvider } from '@blargbot/bbtag';
import { AggregateBBTagError, BBTagRuntimeError, InvalidOperatorError, NotANumberError } from '@blargbot/bbtag';
import { ForSubtag, GetSubtag, IfSubtag, OperatorSubtag, ReturnSubtag, SetSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

const sut = new ForSubtag({
    variables: variablesProvider.instance
});
await runSubtagTests({
    subtag: sut,
    argCountBounds: { min: { count: 5, noEval: [4] }, max: { count: 6, noEval: [5] } },
    names: ['for'],
    setup(ctx) {
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
        variablesProvider.setup(m => m.forContext(ctx.bbtag)).returns(variables.instance);
    },
    cases: [
        {
            code: '{for;index;0;<;10;{get;index},}',
            expected: '0,1,2,3,4,5,6,7,8,9,',
            subtags: [new GetSubtag({ variables: variablesProvider.instance })],
            setup(ctx) {
                setupVariable('index', 'initial', 20, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(10).resolves(undefined);
            },
            assert() {
                assertVariable('index', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
            }
        },
        {
            code: '{for;index;0;<;10;2;{get;index},}',
            expected: '0,2,4,6,8,',
            subtags: [new GetSubtag({ variables: variablesProvider.instance })],
            setup(ctx) {
                setupVariable('index', 'initial', 10, [0, 2, 4, 6, 8]);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(5).resolves(undefined);
            },
            assert() {
                assertVariable('index', [0, 2, 4, 6, 8]);
            }
        },
        {
            code: '{for;index;10;>;0;-1;{get;index},}',
            expected: '10,9,8,7,6,5,4,3,2,1,',
            subtags: [new GetSubtag({ variables: variablesProvider.instance })],
            setup(ctx) {
                setupVariable('index', 'initial', 20, [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(10).resolves(undefined);
            },
            assert() {
                assertVariable('index', [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
            }
        },
        {
            code: '{for;index;1;<;513;0;{get;index},{set;index;{*;{get;index};2}}}',
            expected: '1,2,4,8,16,32,64,128,256,512,',
            subtags: [new GetSubtag({ variables: variablesProvider.instance }), new SetSubtag({ variables: variablesProvider.instance }), new OperatorSubtag()],
            setup(ctx) {
                setupVariable('index', 'initial', 30, [1, ...[2, 4, 8, 16, 32, 64, 128, 256, 512].flatMap(v => [`${v}`, v]), '1024']);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(10).resolves(undefined);
            },
            assert() {
                assertVariable('index', [
                    1,
                    ...[2, 4, 8, 16, 32, 64, 128, 256, 512]
                        .flatMap(v => [`${v}`, v]),
                    '1024'
                ]);
            }
        },
        {
            code: '{for;index;1;<;10;{set;index;abc}xyz}',
            expected: 'xyz`Not a number`',
            errors: [
                { error: new NotANumberError('abc') }
            ],
            subtags: [new SetSubtag({ variables: variablesProvider.instance })],
            setup(ctx) {
                setupVariable('index', 'initial', 1, [1, 'abc']);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(1).resolves(undefined);
            },
            assert() {
                assertVariable('index', [1, 'abc']);
            }
        },
        {
            code: '{for;index;abc;<;10;1;{fail}}',
            expected: '`Initial must be a number`',
            errors: [
                { error: new AggregateBBTagError([new BBTagRuntimeError('Initial must be a number')]) }
            ]
        },
        {
            code: '{for;index;0;abc;10;1;{fail}}',
            expected: '`Invalid operator`',
            errors: [
                { error: new AggregateBBTagError([new InvalidOperatorError('abc')]) }
            ]
        },
        {
            code: '{for;index;0;<;abc;1;{fail}}',
            expected: '`Limit must be a number`',
            errors: [
                { error: new AggregateBBTagError([new BBTagRuntimeError('Limit must be a number')]) }
            ]
        },
        {
            code: '{for;index;0;<;10;abc;{fail}}',
            expected: '`Increment must be a number`',
            errors: [
                { error: new AggregateBBTagError([new BBTagRuntimeError('Increment must be a number')]) }
            ]
        },
        {
            code: '{for;index;abc;def;ghi;jkl;{fail}}',
            expected: '`Initial must be a number, Invalid operator, Limit must be a number, Increment must be a number`',
            errors: [
                {
                    error: new AggregateBBTagError([
                        new BBTagRuntimeError('Initial must be a number'),
                        new InvalidOperatorError('def'),
                        new BBTagRuntimeError('Limit must be a number'),
                        new BBTagRuntimeError('Increment must be a number')
                    ])
                }
            ]
        },
        {
            code: '{for;index;0;<;10;{get;index},}',
            expected: '0,1,2,3,`Too many loops`',
            errors: [
                { error: new BBTagRuntimeError('Too many loops') }
            ],
            subtags: [new GetSubtag({ variables: variablesProvider.instance })],
            setup(ctx) {
                setupVariable('index', 'initial', 8, [0, 1, 2, 3]);
                let i = 0;
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(5).invokesAsync(() => {
                    if (i++ >= 4)
                        throw new BBTagRuntimeError('Too many loops');
                    return undefined;
                });
            },
            assert() {
                assertVariable('index', [0, 1, 2, 3]);
            }
        },
        {
            code: '{for;index;0;<;10;{get;index}{if;{get;index};==;5;{return}},}',
            expected: '0,1,2,3,4,5',
            subtags: [new GetSubtag({ variables: variablesProvider.instance }), new IfSubtag(), new ReturnSubtag()],
            setup(ctx) {
                setupVariable('index', 'initial', 18, [0, 1, 2, 3, 4, 5]);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(6).resolves(undefined);
            },
            assert() {
                assertVariable('index', [0, 1, 2, 3, 4, 5]);
            }
        }
    ]
});

function assertVariable(name: string, values: Iterable<JToken | undefined>): void {
    Mock.verifySequence(
        ...Iterator.from(values)
            .map(v => variables.expression((m, $) => m.set(name, $(v)))),
        variables.expression((m, $) => m.reset($([name])))
    );
}

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
    variables.setup((m, $) => m.reset($([name]))).returns().mustHappen(1);
}
