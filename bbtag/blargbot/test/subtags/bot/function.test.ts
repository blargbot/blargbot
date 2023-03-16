import { BBTagRuntimeError, BBTagRuntimeState, RuntimeModuleOverflowError, Subtag, UnknownSubtagError } from '@bbtag/blargbot';
import { FunctionSubtag } from '@bbtag/blargbot/subtags';
import type { BBTagStatementToken } from '@bbtag/language';
import { parseBBTag } from '@bbtag/language';
import { PromiseCompletionSource } from '@blargbot/async-tools';
import chai from 'chai';

import { AssertSubtag, createDescriptor, runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(FunctionSubtag),
    argCountBounds: { min: { count: 2, noEval: [1] }, max: { count: 2, noEval: [1] } },
    cases: [
        {
            code: '{function;test;{fail}}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.runtime.userFunctions['func.test']).to.deep.equal(<BBTagStatementToken>{
                    values: [
                        {
                            name: {
                                values: ['fail'],
                                source: 'fail',
                                start: { column: 16, line: 0, index: 16 },
                                end: { column: 20, line: 0, index: 20 }
                            },
                            args: [],
                            source: '{fail}',
                            start: { column: 15, line: 0, index: 15 },
                            end: { column: 21, line: 0, index: 21 }
                        }
                    ],
                    source: '{fail}',
                    start: { column: 15, line: 0, index: 15 },
                    end: { column: 21, line: 0, index: 21 }
                });
            }
        },
        {
            code: '{function;func.test;{fail}}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.runtime.userFunctions['func.test']).to.deep.equal(<BBTagStatementToken>{
                    values: [
                        {
                            name: {
                                values: ['fail'],
                                source: 'fail',
                                start: { column: 21, line: 0, index: 21 },
                                end: { column: 25, line: 0, index: 25 }
                            },
                            args: [],
                            source: '{fail}',
                            start: { column: 20, line: 0, index: 20 },
                            end: { column: 26, line: 0, index: 26 }
                        }
                    ],
                    source: '{fail}',
                    start: { column: 20, line: 0, index: 20 },
                    end: { column: 26, line: 0, index: 26 }
                });
            }
        },
        {
            code: '{function;func.;{fail}}',
            expected: '`Must provide a name`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('Must provide a name') }
            ],
            assert(ctx) {
                chai.expect(ctx.runtime.userFunctions['func.']).to.be.undefined;
                chai.expect(ctx.runtime.userFunctions['']).to.be.undefined;
            }
        },
        {
            code: '{func.test}',
            expected: 'Success!',
            subtags: [createDescriptor(new AssertSubtag(ctx => {
                chai.expect(ctx.runtime.scopes.local.paramsarray).to.deep.equal([]);
                chai.expect(ctx.runtime.moduleCount).to.equal(124);
                return 'Success!';
            }))],
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx.runtime, 'func.test')).thenResolve();
                const alwaysPending = new PromiseCompletionSource();
                for (let i = 0; i < 122; i++)
                    void bbctx.runtime.withModule(() => alwaysPending);
                bbctx.runtime.defineSnippet('func.test', parseBBTag('{assert}'));
            },
            assert(ctx) {
                chai.expect(ctx.runtime.scopes.local.paramsarray).to.be.undefined;
                chai.expect(ctx.runtime.moduleCount).to.equal(122);
            }
        },
        {
            code: '{func.test;arg1;arg2;["arg3","arg3"];arg4;}',
            expected: 'Success!',
            subtags: [createDescriptor(new AssertSubtag(ctx => {
                chai.expect(ctx.runtime.scopes.local.paramsarray).to.deep.equal(['arg1', 'arg2', '["arg3","arg3"]', 'arg4', '']);
                chai.expect(ctx.runtime.moduleCount).to.equal(124);
                return 'Success!';
            }))],
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx.runtime, 'func.test')).thenResolve();
                const alwaysPending = new PromiseCompletionSource();
                for (let i = 0; i < 122; i++)
                    void bbctx.runtime.withModule(() => alwaysPending);
                bbctx.runtime.defineSnippet('func.test', parseBBTag('{assert}'));
            },
            assert(ctx) {
                chai.expect(ctx.runtime.scopes.local.paramsarray).to.be.undefined;
                chai.expect(ctx.runtime.moduleCount).to.equal(122);
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
                { start: 0, end: 11, error: new RuntimeModuleOverflowError(200) }
            ],
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx.runtime, 'func.test')).thenResolve();
                const alwaysPending = new PromiseCompletionSource();
                for (let i = 0; i < 199; i++)
                    void bbctx.runtime.withModule(() => alwaysPending);
                bbctx.runtime.defineSnippet('func.test', parseBBTag('{fail}'));
            },
            assert(ctx) {
                chai.expect(ctx.runtime.moduleCount).to.equal(199);
                chai.expect(ctx.runtime.state).to.equal(BBTagRuntimeState.ABORT);
            }
        }
    ]
});
