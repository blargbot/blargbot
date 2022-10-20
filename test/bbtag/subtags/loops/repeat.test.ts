import { BBTagRuntimeError, NotANumberError } from '@blargbot/bbtag/errors';
import { GetSubtag } from '@blargbot/bbtag/subtags/bot/get';
import { ReturnSubtag } from '@blargbot/bbtag/subtags/bot/return';
import { RepeatSubtag } from '@blargbot/bbtag/subtags/loops/repeat';
import { IncrementSubtag } from '@blargbot/bbtag/subtags/math/increment';
import { IfSubtag } from '@blargbot/bbtag/subtags/misc/if';
import { BBTagRuntimeState } from '@blargbot/bbtag/types';
import { TagVariableType } from '@blargbot/domain/models';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new RepeatSubtag(),
    argCountBounds: { min: { count: 2, noEval: [0] }, max: { count: 2, noEval: [0] } },
    cases: [
        {
            code: '{repeat;abc;10}',
            expected: 'abcabcabcabcabcabcabcabcabcabc',
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'repeat:loops')).verifiable(10).thenResolve(undefined);
            }
        },
        {
            code: '{repeat;{increment;index},;8}',
            expected: '1,2,3,4,5,6,7,8,',
            subtags: [new IncrementSubtag()],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.index`] = '0';
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'repeat:loops')).verifiable(8).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                expect((await bbctx.variables.get('index')).value).to.equal(8);
                expect(ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.index`]).to.equal(8);
            }
        },
        {
            code: '{repeat;{fail};abc}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 19, error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{repeat;{fail};-1}',
            expected: '`Can\'t be negative`',
            errors: [
                { start: 0, end: 18, error: new BBTagRuntimeError('Can\'t be negative') }
            ]
        },
        {
            code: '{repeat;{increment;index}{if;{get;index};==;6;{return}},;10}',
            expected: '1,2,3,4,5,6',
            subtags: [new GetSubtag(), new IfSubtag(), new ReturnSubtag(), new IncrementSubtag()],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.index`] = '0';
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, 'repeat:loops')).verifiable(6).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                expect((await bbctx.variables.get('index')).value).to.equal(6);
                expect(ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.index`]).to.equal(6);
                expect(bbctx.data.state).to.equal(BBTagRuntimeState.ABORT);
            }
        },
        {
            code: '{repeat;{increment;index},;10}',
            expected: '1,2,3,4,`Too many loops`',
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Too many loops') }
            ],
            subtags: [new IncrementSubtag()],
            setup(ctx) {
                ctx.options.tagName = 'testTag';
                ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.index`] = '0';
            },
            postSetup(bbctx, ctx) {
                let i = 0;
                ctx.limit.setup(m => m.check(bbctx, 'repeat:loops')).verifiable(5).thenCall(() => {
                    if (i++ >= 4)
                        throw new BBTagRuntimeError('Too many loops');
                    return undefined;
                });
            },
            async assert(bbctx, _, ctx) {
                expect((await bbctx.variables.get('index')).value).to.equal(4);
                expect(ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.index`]).to.equal(4);
            }
        }
    ]
});
