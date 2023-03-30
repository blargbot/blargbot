import { NotAnArrayError } from '@bbtag/blargbot';
import { GetSubtag, ShiftSubtag } from '@bbtag/blargbot/subtags';
import { argument } from '@blargbot/test-util/mock.js';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: ShiftSubtag,
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{shift;abc}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 11, error: new NotAnArrayError('abc') }
            ]
        },
        {
            code: '{shift;var1}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 12, error: new NotAnArrayError('var1') }
            ],
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'var1' }, 'this is var1');
            }
        },
        {
            code: '{shift;[1,2,3]}',
            expected: '1'
        },
        {
            code: '{shift;{get;arr1}}',
            expected: 'this',
            subtags: [GetSubtag],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
            },
            async assert(bbctx, _, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'arr1' })).to.deep.equal(['this', 'is', 'arr1']);
                chai.expect((await bbctx.runtime.variables.get('arr1')).value).to.deep.equal(['is', 'arr1']);
            }
        },
        {
            code: '{shift;arr1}',
            expected: 'this',
            subtags: [GetSubtag],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
            },
            async assert(bbctx, _, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'arr1' })).to.deep.equal(['this', 'is', 'arr1']);
                chai.expect((await bbctx.runtime.variables.get('arr1')).value).to.deep.equal(['is', 'arr1']);
            }
        },
        {
            code: '{shift;!arr1}',
            expected: 'this',
            subtags: [GetSubtag],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { ownerId: 0n, scope: 'local:tag:testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
                ctx.variables.setup(m => m.set(argument.isDeepEqual([{ name: 'arr1', value: ['is', 'arr1'], scope: { ownerId: 0n, scope: 'local:tag:testTag' } }]))).thenResolve(undefined);
            },
            async assert(bbctx) {
                chai.expect((await bbctx.runtime.variables.get('arr1')).value).to.deep.equal(['is', 'arr1']);
            }
        },
        {
            code: '{shift;[]}',
            expected: ''
        }
    ]
});
