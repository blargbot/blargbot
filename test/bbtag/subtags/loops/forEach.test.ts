import type { Variables, VariablesProvider } from '@blargbot/bbtag';
import { BBTagRuntimeError } from '@blargbot/bbtag';
import { ForEachSubtag, GetSubtag, IfSubtag, ReturnSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

const sut = new ForEachSubtag({
    variables: variablesProvider.instance
});
await runSubtagTests({
    subtag: sut,
    argCountBounds: { min: { count: 3, noEval: [2] }, max: { count: 3, noEval: [2] } },
    names: ['forEach'],
    setup(ctx) {
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
        variablesProvider.setup(m => m.forContext(ctx.bbtag)).returns(variables.instance);
    },
    cases: [
        {
            code: '{foreach;a;b;c{fail}}',
            expected: '',
            setup() {
                variables.setup(m => m.get('b')).resolves({ key: 'baz', value: undefined }).mustHappen(1);
                setupVariable('a', undefined, 0, []);
            }
        },
        {
            code: '{foreach;a;arr1;<{get;a}>}',
            expected: '<this><is><arr1>',
            subtags: [new GetSubtag({ variables: variablesProvider.instance })],
            setup(ctx) {
                variables.setup(m => m.get('arr1')).resolves({ key: 'baz', value: ['this', 'is', 'arr1'] }).mustHappen(1);
                setupVariable('a', 'initial', 3, ['this', 'is', 'arr1']);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(3).resolves(undefined);
            },
            assert() {
                assertVariable('a', ['this', 'is', 'arr1']);
            }
        },
        {
            code: '{foreach;a;{get;arr1};<{get;a}>}',
            expected: '<this><is><arr1>',
            subtags: [new GetSubtag({ variables: variablesProvider.instance })],
            setup(ctx) {
                variables.setup(m => m.get('arr1')).resolves({ key: 'baz', value: ['this', 'is', 'arr1'] }).mustHappen(1);
                setupVariable('a', 'initial', 3, ['this', 'is', 'arr1']);
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(3).resolves(undefined);
            },
            assert() {
                assertVariable('a', ['this', 'is', 'arr1']);
            }
        },
        {
            code: '{foreach;a;var1;<{get;a}>}',
            expected: '<t><h><i><s>< ><i><s>< ><v><a><r><1>',
            subtags: [new GetSubtag({ variables: variablesProvider.instance })],
            setup(ctx) {
                variables.setup(m => m.get('var1')).resolves({ key: 'baz', value: 'this is var1' }).mustHappen(1);
                setupVariable('a', 'initial', 12, 'this is var1');
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(12).resolves(undefined);
            },
            assert() {
                assertVariable('a', 'this is var1');
            }
        },
        {
            code: '{foreach;a;var1;<{get;a}>{if;{get;a};==;s;{return}}}',
            expected: '<t><h><i><s>',
            subtags: [new GetSubtag({ variables: variablesProvider.instance }), new IfSubtag(), new ReturnSubtag()],
            setup(ctx) {
                variables.setup(m => m.get('var1')).resolves({ key: 'baz', value: 'this is var1' }).mustHappen(1);
                setupVariable('a', 'initial', 8, 'this');
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(4).resolves(undefined);
            },
            assert() {
                assertVariable('a', 'this');
            }
        },
        {
            code: '{foreach;a;{get;arr1};<{get;a}>}',
            expected: '<this>`Too many loops`',
            errors: [
                { error: new BBTagRuntimeError('Too many loops') }
            ],
            subtags: [new GetSubtag({ variables: variablesProvider.instance })],
            setup(ctx) {
                variables.setup(m => m.get('arr1')).resolves({ key: 'baz', value: ['this', 'is', 'arr1'] }).mustHappen(1);
                setupVariable('a', 'initial', 1, ['this']);
                let i = 0;
                ctx.hooks.setup(m => m.loop!(sut)).mustHappen(2).invokesAsync(() => {
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
