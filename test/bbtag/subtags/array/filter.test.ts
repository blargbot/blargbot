import type { Variables, VariablesProvider } from '@blargbot/bbtag';
import { BBTagRuntimeError } from '@blargbot/bbtag';
import { CommentSubtag, FilterSubtag, GetSubtag, IfSubtag, LengthSubtag, OperatorSubtag, ReturnSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

await runSubtagTests({
    subtag: new FilterSubtag({
        variables: variablesProvider.instance
    }),
    argCountBounds: { min: { count: 3, noEval: [2] }, max: { count: 3, noEval: [2] } },
    names: ['filter'],
    setup(ctx) {
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
    },
    postSetup(bbctx) {
        variablesProvider.setup(m => m.forContext(bbctx)).returns(variables.instance);
    },
    cases: [
        {
            code: '{filter;a;b;c{fail}}',
            expected: '[]',
            setup() {
                variables.setup(m => m.get('b')).resolves({ key: 'foo', value: undefined }).mustHappen(1);
                setupVariable('a', undefined, 0, []);
            }
        },
        {
            code: '{filter;a;arr1;{==;{length;{get;a}};4}}',
            expected: '["this","arr1"]',
            subtags: [new GetSubtag({ variables: variablesProvider.instance }), new OperatorSubtag(), new LengthSubtag()],
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: ['this', 'is', 'arr1'] }).mustHappen(1);
                setupVariable('a', 'initial', 3, ['this', 'is', 'arr1']);
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'filter:loops')).mustHappen(3).resolves(undefined);
            },
            assert() {
                assertVariable('a', ['this', 'is', 'arr1']);
            }
        },
        {
            code: '{filter;a;{get;arr1};{==;{length;{get;a}};4}}',
            expected: '["this","arr1"]',
            subtags: [new GetSubtag({ variables: variablesProvider.instance }), new OperatorSubtag(), new LengthSubtag()],
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: ['this', 'is', 'arr1'] }).mustHappen(1);
                setupVariable('a', 'initial', 3, ['this', 'is', 'arr1']);
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'filter:loops')).mustHappen(3).resolves(undefined);
            },
            assert() {
                assertVariable('a', ['this', 'is', 'arr1']);
            }
        },
        {
            code: '{filter;a;var1;{contains;aieou;{get;a}}}',
            expected: '["i","i","a"]',
            subtags: [new GetSubtag({ variables: variablesProvider.instance }), new OperatorSubtag()],
            setup() {
                variables.setup(m => m.get('var1')).resolves({ key: 'foo', value: 'this is var1' }).mustHappen(1);
                setupVariable('a', 'initial', 12, 'this is var1');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'filter:loops')).mustHappen(12).resolves(undefined);
            },
            assert() {
                assertVariable('a', 'this is var1');
            }
        },
        {
            code: '{filter;a;var1;{//;aaaaaa}    {contains;aieou;{get;a}}}',
            expected: '["i","i","a"]',
            subtags: [new GetSubtag({ variables: variablesProvider.instance }), new OperatorSubtag(), new CommentSubtag()],
            setup() {
                variables.setup(m => m.get('var1')).resolves({ key: 'foo', value: 'this is var1' }).mustHappen(1);
                setupVariable('a', 'initial', 12, 'this is var1');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'filter:loops')).mustHappen(12).resolves(undefined);
            },
            assert() {
                assertVariable('a', 'this is var1');
            }
        },
        {
            code: '{filter;a;var1;{contains;aieou;{get;a}}      {//;aaaaaa}}',
            expected: '["i","i","a"]',
            subtags: [new GetSubtag({ variables: variablesProvider.instance }), new OperatorSubtag(), new CommentSubtag()],
            setup() {
                variables.setup(m => m.get('var1')).resolves({ key: 'foo', value: 'this is var1' }).mustHappen(1);
                setupVariable('a', 'initial', 12, 'this is var1');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'filter:loops')).mustHappen(12).resolves(undefined);
            },
            assert() {
                assertVariable('a', 'this is var1');
            }
        },
        {
            code: '{filter;a;var1;true{if;{get;a};==;s;{return}}}',
            expected: '["t","h","i","s"]',
            subtags: [new GetSubtag({ variables: variablesProvider.instance }), new IfSubtag(), new ReturnSubtag()],
            setup() {
                variables.setup(m => m.get('var1')).resolves({ key: 'foo', value: 'this is var1' }).mustHappen(1);
                setupVariable('a', 'initial', 4, 'this');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'filter:loops')).mustHappen(4).resolves(undefined);
            },
            assert() {
                assertVariable('a', 'this');
            }
        },
        {
            code: '{filter;a;{get;arr1};true}',
            expected: '["this","`Too many loops`"]',
            errors: [
                { error: new BBTagRuntimeError('Too many loops') }
            ],
            subtags: [new GetSubtag({ variables: variablesProvider.instance })],
            setup() {
                variables.setup(m => m.get('arr1')).resolves({ key: 'foo', value: ['this', 'is', 'arr1'] }).mustHappen(1);
                setupVariable('a', 'initial', 0, ['this']);
            },
            postSetup(bbctx, ctx) {
                let i = 0;
                ctx.limit.setup(m => m.check(bbctx, 'filter:loops')).mustHappen(2).invokesAsync(() => {
                    if (i++ >= 1)
                        throw new BBTagRuntimeError('Too many loops');
                    return undefined;
                });
            },
            assert() {
                assertVariable('a', ['this']);
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
    const setCounts = Iterator.from(setTo).reduce((m, v) => {
        m.set(v, (m.get(v) ?? 0) + 1);
        return m;
    }, new Map<JToken | undefined, number>());
    for (const [value, count] of setCounts)
        variables.setup(m => m.set(name, value)).invokesAsync(() => void (current = value)).mustHappen(count);
    variables.setup((m, $) => m.reset($([name]))).returns().mustHappen(1);
}
