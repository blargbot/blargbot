import type { Variables, VariablesProvider } from '@blargbot/bbtag';
import { BBTagRuntimeError } from '@blargbot/bbtag';
import { DecrementSubtag, GetSubtag, IfSubtag, IncrementSubtag, OperatorSubtag, ReturnSubtag, SetSubtag, WhileSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

const sut = new WhileSubtag();
await runSubtagTests({
    subtag: sut,
    argCountBounds: { min: { count: 2, noEval: [0, 1] }, max: { count: 4, noEval: [0, 1, 2, 3] } },
    names: ['while'],
    otherSubtags: [
        new GetSubtag({ variables: variablesProvider.instance }),
        new SetSubtag({ variables: variablesProvider.instance }),
        new IncrementSubtag({ variables: variablesProvider.instance }),
        new DecrementSubtag({ variables: variablesProvider.instance })
    ],
    setup(ctx) {
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
        variablesProvider.setup(m => m.forContext(ctx.bbtag)).returns(variables.instance);
    },
    cases: [
        {
            code: '{while;{<;{get;index};10};{increment;index},}',
            expected: '1,2,3,4,5,6,7,8,9,10,',
            subtags: [new OperatorSubtag()],
            setup(ctx) {
                setupVariable('index', '0', 21, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(10).resolves(undefined);
            },
            assert() {
                Mock.verifySequence(...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                    .map(value => variables.expression(m => m.set('index', value))));
            }
        },
        {
            code: '{while;{get;index};<;10;{increment;index},}',
            expected: '1,2,3,4,5,6,7,8,9,10,',
            setup(ctx) {
                setupVariable('index', '0', 21, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(10).resolves(undefined);
            },
            assert() {
                Mock.verifySequence(...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                    .map(value => variables.expression(m => m.set('index', value))));
            }
        },
        {
            code: '{while;<;{get;index};10;{increment;index},}',
            expected: '1,2,3,4,5,6,7,8,9,10,',
            setup(ctx) {
                setupVariable('index', '0', 21, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(10).resolves(undefined);
            },
            assert() {
                Mock.verifySequence(...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                    .map(value => variables.expression(m => m.set('index', value))));
            }
        },
        {
            code: '{while;{get;index};10;<;{increment;index},}',
            expected: '1,2,3,4,5,6,7,8,9,10,',
            setup(ctx) {
                setupVariable('index', '0', 21, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(10).resolves(undefined);
            },
            assert() {
                Mock.verifySequence(...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                    .map(value => variables.expression(m => m.set('index', value))));
            }
        },
        {
            code: '{while;{get;index};<;10;{increment;index;2},}',
            expected: '2,4,6,8,10,',
            setup(ctx) {
                setupVariable('index', '0', 11, [2, 4, 6, 8, 10]);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(5).resolves(undefined);
            },
            assert() {
                Mock.verifySequence(...[2, 4, 6, 8, 10]
                    .map(value => variables.expression(m => m.set('index', value))));
            }
        },
        {
            code: '{while;{get;index};>;0;{decrement;index},}',
            expected: '9,8,7,6,5,4,3,2,1,0,',
            setup(ctx) {
                setupVariable('index', '10', 21, [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(10).resolves(undefined);
            },
            assert() {
                Mock.verifySequence(...[9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
                    .map(value => variables.expression(m => m.set('index', value))));
            }
        },
        {
            code: '{while;{get;index};<;513;{get;index},{set;index;{*;{get;index};2}}}',
            expected: '1,2,4,8,16,32,64,128,256,512,',
            subtags: [new OperatorSubtag()],
            setup(ctx) {
                setupVariable('index', '1', 31, ['2', '4', '8', '16', '32', '64', '128', '256', '512', '1024']);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(10).resolves(undefined);
            },
            assert() {
                Mock.verifySequence(...['2', '4', '8', '16', '32', '64', '128', '256', '512', '1024']
                    .map(value => variables.expression(m => m.set('index', value))));
            }
        },
        {
            code: '{while;{get;index};<;10;{increment;index},}',
            expected: '1,2,3,4,`Too many loops`',
            errors: [
                { error: new BBTagRuntimeError('Too many loops') }
            ],
            setup(ctx) {
                setupVariable('index', '0', 9, [1, 2, 3, 4]);
                ctx.hooks.setup(m => m.loop!(sut))
                    .resolves()
                    .resolves()
                    .resolves()
                    .resolves()
                    .rejects(new BBTagRuntimeError('Too many loops'));
            },
            assert() {
                Mock.verifySequence(...[1, 2, 3, 4]
                    .map(value => variables.expression(m => m.set('index', value))));
            }
        },
        {
            code: '{while;abc;def;ghi;{increment;index},}',
            expected: '1,2,3,4,`Too many loops`',
            errors: [
                { error: new BBTagRuntimeError('Too many loops') }
            ],
            setup(ctx) {
                setupVariable('index', '0', 4, [1, 2, 3, 4]);
                ctx.hooks.setup(m => m.loop!(sut))
                    .resolves()
                    .resolves()
                    .resolves()
                    .resolves()
                    .rejects(new BBTagRuntimeError('Too many loops'));
            },
            assert() {
                Mock.verifySequence(...[1, 2, 3, 4]
                    .map(value => variables.expression(m => m.set('index', value))));
            }
        },
        {
            code: '{while;true;{increment;index},}',
            expected: '1,2,3,4,`Too many loops`',
            errors: [
                { error: new BBTagRuntimeError('Too many loops') }
            ],
            setup(ctx) {
                setupVariable('index', '0', 4, [1, 2, 3, 4]);
                ctx.hooks.setup(m => m.loop!(sut))
                    .resolves()
                    .resolves()
                    .resolves()
                    .resolves()
                    .rejects(new BBTagRuntimeError('Too many loops'));
            },
            assert() {
                Mock.verifySequence(...[1, 2, 3, 4]
                    .map(value => variables.expression(m => m.set('index', value))));
            }
        },
        {
            code: '{while;{get;index};<;10;{increment;index}{if;{get;index};==;6;{return}},}',
            expected: '1,2,3,4,5,6',
            subtags: [new IfSubtag(), new ReturnSubtag()],
            setup(ctx) {
                setupVariable('index', '0', 18, [1, 2, 3, 4, 5, 6]);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(6).resolves(undefined);
            },
            assert() {
                Mock.verifySequence(...[1, 2, 3, 4, 5, 6]
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
