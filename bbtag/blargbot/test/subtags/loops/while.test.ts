import { BBTagRuntimeError, BBTagRuntimeState } from '@bbtag/blargbot';
import { DecrementSubtag, GetSubtag, IfSubtag, IncrementSubtag, OperatorSubtag, ReturnSubtag, SetSubtag, WhileSubtag } from '@bbtag/blargbot/subtags';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: WhileSubtag,
    argCountBounds: { min: { count: 2, noEval: [0, 1] }, max: { count: 4, noEval: [0, 1, 2, 3] } },
    cases: [
        {
            code: '{while;{<;{get;index};10};{increment;index},}',
            expected: '1,2,3,4,5,6,7,8,9,10,',
            subtags: [GetSubtag, IncrementSubtag, OperatorSubtag],
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'index' }, '0');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx.runtime, 'while:loops'))
                    .verifiable(10)
                    .thenResolve(...Array.from({ length: 10 }, () => undefined))
                    .thenReject(new RangeError('Too many calls to check while:loops, expected exactly 10'));
            },
            async assert(bbctx, _, ctx) {
                chai.expect((await bbctx.runtime.variables.get('index')).value).to.equal(10);
                chai.expect(ctx.tagVariables.get({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'index' })).to.equal(10);
            }
        },
        {
            code: '{while;{get;index};<;10;{increment;index},}',
            expected: '1,2,3,4,5,6,7,8,9,10,',
            subtags: [GetSubtag, IncrementSubtag],
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'index' }, '0');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx.runtime, 'while:loops'))
                    .verifiable(10)
                    .thenResolve(...Array.from({ length: 10 }, () => undefined))
                    .thenReject(new RangeError('Too many calls to check while:loops, expected exactly 10'));
            },
            async assert(bbctx, _, ctx) {
                chai.expect((await bbctx.runtime.variables.get('index')).value).to.equal(10);
                chai.expect(ctx.tagVariables.get({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'index' })).to.equal(10);
            }
        },
        {
            code: '{while;<;{get;index};10;{increment;index},}',
            expected: '1,2,3,4,5,6,7,8,9,10,',
            subtags: [GetSubtag, IncrementSubtag],
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'index' }, '0');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx.runtime, 'while:loops'))
                    .verifiable(10)
                    .thenResolve(...Array.from({ length: 10 }, () => undefined))
                    .thenReject(new RangeError('Too many calls to check while:loops, expected exactly 10'));
            },
            async assert(bbctx, _, ctx) {
                chai.expect((await bbctx.runtime.variables.get('index')).value).to.equal(10);
                chai.expect(ctx.tagVariables.get({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'index' })).to.equal(10);
            }
        },
        {
            code: '{while;{get;index};10;<;{increment;index},}',
            expected: '1,2,3,4,5,6,7,8,9,10,',
            subtags: [GetSubtag, IncrementSubtag],
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'index' }, '0');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx.runtime, 'while:loops'))
                    .verifiable(10)
                    .thenResolve(...Array.from({ length: 10 }, () => undefined))
                    .thenReject(new RangeError('Too many calls to check while:loops, expected exactly 10'));
            },
            async assert(bbctx, _, ctx) {
                chai.expect((await bbctx.runtime.variables.get('index')).value).to.equal(10);
                chai.expect(ctx.tagVariables.get({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'index' })).to.equal(10);
            }
        },
        {
            code: '{while;{get;index};<;10;{increment;index;2},}',
            expected: '2,4,6,8,10,',
            subtags: [GetSubtag, IncrementSubtag],
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'index' }, '0');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx.runtime, 'while:loops'))
                    .verifiable(5)
                    .thenResolve(...Array.from({ length: 5 }, () => undefined))
                    .thenReject(new RangeError('Too many calls to check while:loops, expected exactly 5'));
            },
            async assert(bbctx, _, ctx) {
                chai.expect((await bbctx.runtime.variables.get('index')).value).to.equal(10);
                chai.expect(ctx.tagVariables.get({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'index' })).to.equal(10);
            }
        },
        {
            code: '{while;{get;index};>;0;{decrement;index},}',
            expected: '9,8,7,6,5,4,3,2,1,0,',
            subtags: [GetSubtag, DecrementSubtag],
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'index' }, '10');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx.runtime, 'while:loops'))
                    .verifiable(10)
                    .thenResolve(...Array.from({ length: 10 }, () => undefined))
                    .thenReject(new RangeError('Too many calls to check while:loops, expected exactly 10'));
            },
            async assert(bbctx, _, ctx) {
                chai.expect((await bbctx.runtime.variables.get('index')).value).to.equal(0);
                chai.expect(ctx.tagVariables.get({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'index' })).to.equal(0);
            }
        },
        {
            code: '{while;{get;index};<;513;{get;index},{set;index;{*;{get;index};2}}}',
            expected: '1,2,4,8,16,32,64,128,256,512,',
            subtags: [GetSubtag, SetSubtag, OperatorSubtag],
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'index' }, '1');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx.runtime, 'while:loops'))
                    .verifiable(10)
                    .thenResolve(...Array.from({ length: 10 }, () => undefined))
                    .thenReject(new RangeError('Too many calls to check while:loops, expected exactly 10'));
            },
            async assert(bbctx, _, ctx) {
                chai.expect((await bbctx.runtime.variables.get('index')).value).to.equal('1024');
                chai.expect(ctx.tagVariables.get({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'index' })).to.equal('1024');
            }
        },
        {
            code: '{while;{get;index};<;10;{increment;index},}',
            expected: '1,2,3,4,`Too many loops`',
            errors: [
                { start: 0, end: 43, error: new BBTagRuntimeError('Too many loops') }
            ],
            subtags: [GetSubtag, IncrementSubtag],
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'index' }, '0');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx.runtime, 'while:loops'))
                    .verifiable(5)
                    .thenResolve(...Array.from({ length: 4 }, () => undefined))
                    .thenReject(new BBTagRuntimeError('Too many loops'));
            },
            async assert(bbctx, _, ctx) {
                chai.expect((await bbctx.runtime.variables.get('index')).value).to.equal(4);
                chai.expect(ctx.tagVariables.get({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'index' })).to.equal(4);
            }
        },
        {
            code: '{while;abc;def;ghi;{increment;index},}',
            expected: '1,2,3,4,`Too many loops`',
            errors: [
                { start: 0, end: 38, error: new BBTagRuntimeError('Too many loops') }
            ],
            subtags: [GetSubtag, IncrementSubtag],
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'index' }, '0');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx.runtime, 'while:loops'))
                    .verifiable(5)
                    .thenResolve(...Array.from({ length: 4 }, () => undefined))
                    .thenReject(new BBTagRuntimeError('Too many loops'));
            },
            async assert(bbctx, _, ctx) {
                chai.expect((await bbctx.runtime.variables.get('index')).value).to.equal(4);
                chai.expect(ctx.tagVariables.get({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'index' })).to.equal(4);
            }
        },
        {
            code: '{while;true;{increment;index},}',
            expected: '1,2,3,4,`Too many loops`',
            errors: [
                { start: 0, end: 31, error: new BBTagRuntimeError('Too many loops') }
            ],
            subtags: [GetSubtag, IncrementSubtag],
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'index' }, '0');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx.runtime, 'while:loops'))
                    .verifiable(5)
                    .thenResolve(...Array.from({ length: 4 }, () => undefined))
                    .thenReject(new BBTagRuntimeError('Too many loops'));
            },
            async assert(bbctx, _, ctx) {
                chai.expect((await bbctx.runtime.variables.get('index')).value).to.equal(4);
                chai.expect(ctx.tagVariables.get({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'index' })).to.equal(4);
            }
        },
        {
            code: '{while;{get;index};<;10;{increment;index}{if;{get;index};==;6;{return}},}',
            expected: '1,2,3,4,5,6',
            subtags: [GetSubtag, IfSubtag, ReturnSubtag, IncrementSubtag],
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'index' }, '0');
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx.runtime, 'while:loops'))
                    .verifiable(6)
                    .thenResolve(...Array.from({ length: 6 }, () => undefined))
                    .thenReject(new RangeError('Too many calls to check while:loops, expected exactly 6'));
            },
            async assert(bbctx, _, ctx) {
                chai.expect((await bbctx.runtime.variables.get('index')).value).to.equal(6);
                chai.expect(ctx.tagVariables.get({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'index' })).to.equal(6);
                chai.expect(bbctx.runtime.state).to.equal(BBTagRuntimeState.ABORT);
            }
        }
    ]
});
