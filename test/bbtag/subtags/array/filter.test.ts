import { BBTagRuntimeError } from '@blargbot/bbtag/errors';
import { FilterSubtag } from '@blargbot/bbtag/subtags/array/filter';
import { GetSubtag } from '@blargbot/bbtag/subtags/bot/get';
import { ReturnSubtag } from '@blargbot/bbtag/subtags/bot/return';
import { CommentSubtag } from '@blargbot/bbtag/subtags/misc';
import { IfSubtag } from '@blargbot/bbtag/subtags/misc/if';
import { LengthSubtag } from '@blargbot/bbtag/subtags/misc/length';
import { OperatorSubtag } from '@blargbot/bbtag/subtags/misc/operator';
import { BBTagRuntimeState } from '@blargbot/bbtag/types';
import { TagVariableType } from '@blargbot/domain/models';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new FilterSubtag(),
    argCountBounds: { min: { count: 3, noEval: [2] }, max: { count: 3, noEval: [2] } },
    cases: [
        {
            code: `{filter;a;b;c{fail}}`,
            expected: `[]`
        },
        {
            code: `{filter;a;arr1;{==;{length;{get;a}};4}}`,
            expected: `["this","arr1"]`,
            subtags: [new GetSubtag(), new OperatorSubtag(), new LengthSubtag()],
            setup(ctx) {
                ctx.options.tagName = `testTag`;
                ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.arr1`] = [`this`, `is`, `arr1`];
                ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.a`] = `initial`;
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, `filter:loops`)).verifiable(3).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                expect((await bbctx.variables.get(`a`)).value).to.equal(`initial`);
                expect(ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.a`]).to.equal(`initial`);
            }
        },
        {
            code: `{filter;a;{get;arr1};{==;{length;{get;a}};4}}`,
            expected: `["this","arr1"]`,
            subtags: [new GetSubtag(), new OperatorSubtag(), new LengthSubtag()],
            setup(ctx) {
                ctx.options.tagName = `testTag`;
                ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.arr1`] = [`this`, `is`, `arr1`];
                ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.a`] = `initial`;
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, `filter:loops`)).verifiable(3).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                expect((await bbctx.variables.get(`a`)).value).to.equal(`initial`);
                expect(ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.a`]).to.equal(`initial`);
            }
        },
        {
            code: `{filter;a;var1;{contains;aieou;{get;a}}}`,
            expected: `["i","i","a"]`,
            subtags: [new GetSubtag(), new OperatorSubtag()],
            setup(ctx) {
                ctx.options.tagName = `testTag`;
                ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.var1`] = `this is var1`;
                ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.a`] = `initial`;
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, `filter:loops`)).verifiable(12).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                expect((await bbctx.variables.get(`a`)).value).to.equal(`initial`);
                expect(ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.a`]).to.equal(`initial`);
            }
        },
        {
            code: `{filter;a;var1;{//;aaaaaa}    {contains;aieou;{get;a}}}`,
            expected: `["i","i","a"]`,
            subtags: [new GetSubtag(), new OperatorSubtag(), new CommentSubtag()],
            setup(ctx) {
                ctx.options.tagName = `testTag`;
                ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.var1`] = `this is var1`;
                ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.a`] = `initial`;
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, `filter:loops`)).verifiable(12).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                expect((await bbctx.variables.get(`a`)).value).to.equal(`initial`);
                expect(ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.a`]).to.equal(`initial`);
            }
        },
        {
            code: `{filter;a;var1;{contains;aieou;{get;a}}      {//;aaaaaa}}`,
            expected: `["i","i","a"]`,
            subtags: [new GetSubtag(), new OperatorSubtag(), new CommentSubtag()],
            setup(ctx) {
                ctx.options.tagName = `testTag`;
                ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.var1`] = `this is var1`;
                ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.a`] = `initial`;
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, `filter:loops`)).verifiable(12).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                expect((await bbctx.variables.get(`a`)).value).to.equal(`initial`);
                expect(ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.a`]).to.equal(`initial`);
            }
        },
        {
            code: `{filter;a;var1;true{if;{get;a};==;s;{return}}}`,
            expected: `["t","h","i","s"]`,
            subtags: [new GetSubtag(), new IfSubtag(), new ReturnSubtag()],
            setup(ctx) {
                ctx.options.tagName = `testTag`;
                ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.var1`] = `this is var1`;
                ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.a`] = `initial`;
            },
            postSetup(bbctx, ctx) {
                ctx.limit.setup(m => m.check(bbctx, `filter:loops`)).verifiable(4).thenResolve(undefined);
            },
            async assert(bbctx, _, ctx) {
                expect((await bbctx.variables.get(`a`)).value).to.equal(`initial`);
                expect(ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.a`]).to.equal(`initial`);
                expect(bbctx.data.state).to.equal(BBTagRuntimeState.ABORT);
            }
        },
        {
            code: `{filter;a;{get;arr1};true}`,
            expected: `["this","\`Too many loops\`"]`,
            errors: [
                { start: 0, end: 26, error: new BBTagRuntimeError(`Too many loops`) }
            ],
            subtags: [new GetSubtag()],
            setup(ctx) {
                ctx.options.tagName = `testTag`;
                ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.arr1`] = [`this`, `is`, `arr1`];
                ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.a`] = `initial`;
            },
            postSetup(bbctx, ctx) {
                let i = 0;
                ctx.limit.setup(m => m.check(bbctx, `filter:loops`)).verifiable(2).thenCall(() => {
                    if (i++ >= 1)
                        throw new BBTagRuntimeError(`Too many loops`);
                    return undefined;
                });
            },
            async assert(bbctx, _, ctx) {
                expect((await bbctx.variables.get(`a`)).value).to.equal(`initial`);
                expect(ctx.tagVariables[`${TagVariableType.LOCAL}.testTag.a`]).to.equal(`initial`);
            }
        }
    ]
});
