import { SubtagStackOverflowError, UnknownSubtagError } from '@cluster/bbtag/errors';
import { FunctionInvokeSubtag } from '@cluster/subtags/bot/func.';
import { BBTagRuntimeState } from '@cluster/types';
import { bbtag } from '@cluster/utils';
import { expect } from 'chai';

import { AssertSubtag, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new FunctionInvokeSubtag(),
    argCountBounds: { min: 0, max: Infinity },
    cases: [
        {
            code: '{func.test}',
            expected: 'Success!',
            subtags: [new AssertSubtag(ctx => {
                expect(ctx.scopes.local.paramsarray).to.deep.equal([]);
                expect(ctx.data.stackSize).to.equal(123);
                return 'Success!';
            })],
            setup(ctx) {
                ctx.rootScope.functions['test'] = bbtag.parse('{assert}');
                ctx.options.data = { stackSize: 122 };
            },
            assert(ctx) {
                expect(ctx.scopes.local.paramsarray).to.be.undefined;
                expect(ctx.data.stackSize).to.equal(122);
            }
        },
        {
            code: '{func.test;arg1;arg2;["arg3","arg3"];arg4;}',
            expected: 'Success!',
            subtags: [new AssertSubtag(ctx => {
                expect(ctx.scopes.local.paramsarray).to.deep.equal(['arg1', 'arg2', '["arg3","arg3"]', 'arg4', '']);
                expect(ctx.data.stackSize).to.equal(123);
                return 'Success!';
            })],
            setup(ctx) {
                ctx.rootScope.functions['test'] = bbtag.parse('{assert}');
                ctx.options.data = { stackSize: 122 };
            },
            assert(ctx) {
                expect(ctx.scopes.local.paramsarray).to.be.undefined;
                expect(ctx.data.stackSize).to.equal(122);
            }
        },
        {
            code: '{func.test}',
            expected: '`Unknown subtag func.test`',
            errors: [
                { start: 0, end: 11, error: new UnknownSubtagError('func.test') }
            ]
        },
        {
            code: '{func.test}',
            expected: '`Terminated recursive tag after 200 execs.`',
            errors: [
                { start: 0, end: 11, error: new SubtagStackOverflowError(200) }
            ],
            setup(ctx) {
                ctx.options.data = { stackSize: 200 };
                ctx.rootScope.functions['test'] = bbtag.parse('{assert}');
            },
            assert(ctx) {
                expect(ctx.data.stackSize).to.equal(200);
                expect(ctx.data.state).to.equal(BBTagRuntimeState.ABORT);
            }
        }
    ]
});
