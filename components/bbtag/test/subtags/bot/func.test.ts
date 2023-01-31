import { BBTagRuntimeState, parseBBTag, Subtag, SubtagStackOverflowError, UnknownSubtagError  } from '@blargbot/bbtag';
import { FunctionInvokeSubtag } from '@blargbot/bbtag/subtags';
import chai from 'chai';

import { AssertSubtag, createDescriptor, runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(FunctionInvokeSubtag),
    argCountBounds: { min: 0, max: Infinity },
    cases: [
        {
            code: '{func.test}',
            expected: 'Success!',
            subtags: [createDescriptor(new AssertSubtag(ctx => {
                chai.expect(ctx.scopes.local.paramsarray).to.deep.equal([]);
                chai.expect(ctx.data.stackSize).to.equal(123);
                return 'Success!';
            }))],
            setup(ctx) {
                ctx.rootScope.functions['test'] = parseBBTag('{assert}');
                ctx.options.data = { stackSize: 122 };
            },
            assert(ctx) {
                chai.expect(ctx.scopes.local.paramsarray).to.be.undefined;
                chai.expect(ctx.data.stackSize).to.equal(122);
            }
        },
        {
            code: '{func.test;arg1;arg2;["arg3","arg3"];arg4;}',
            expected: 'Success!',
            subtags: [createDescriptor(new AssertSubtag(ctx => {
                chai.expect(ctx.scopes.local.paramsarray).to.deep.equal(['arg1', 'arg2', '["arg3","arg3"]', 'arg4', '']);
                chai.expect(ctx.data.stackSize).to.equal(123);
                return 'Success!';
            }))],
            setup(ctx) {
                ctx.rootScope.functions['test'] = parseBBTag('{assert}');
                ctx.options.data = { stackSize: 122 };
            },
            assert(ctx) {
                chai.expect(ctx.scopes.local.paramsarray).to.be.undefined;
                chai.expect(ctx.data.stackSize).to.equal(122);
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
                ctx.rootScope.functions['test'] = parseBBTag('{assert}');
            },
            assert(ctx) {
                chai.expect(ctx.data.stackSize).to.equal(200);
                chai.expect(ctx.data.state).to.equal(BBTagRuntimeState.ABORT);
            }
        }
    ]
});
