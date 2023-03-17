import { TagVariableType } from '@bbtag/blargbot';
import { GetSubtag, SortSubtag } from '@bbtag/blargbot/subtags';
import { argument } from '@blargbot/test-util/mock.js';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: SortSubtag,
    argCountBounds: { min: 1, max: 2 },
    cases: [
        {
            code: '{sort;[2,3,0,8,7,4,8,9,2,4,3]}',
            expected: '[0,2,2,3,3,4,4,7,8,8,9]'
        },
        {
            code: '{sort;["as","dlah","j","","fliuka","ufhea","uik"]}',
            expected: '["","as","dlah","fliuka","j","ufhea","uik"]'
        },
        {
            code: '{sort;[2,3,0,8,7,4,8,9,2,4,3];false}',
            expected: '[0,2,2,3,3,4,4,7,8,8,9]'
        },
        {
            code: '{sort;["as","dlah","j","","fliuka","ufhea","uik"];false}',
            expected: '["","as","dlah","fliuka","j","ufhea","uik"]'
        },
        {
            code: '{sort;[2,3,0,8,7,4,8,9,2,4,3];true}',
            expected: '[9,8,8,7,4,4,3,3,2,2,0]'
        },
        {
            code: '{sort;["as","dlah","j","","fliuka","ufhea","uik"];true}',
            expected: '["uik","ufhea","j","fliuka","dlah","as",""]'
        },
        {
            code: '{sort;[2,3,0,8,7,4,8,9,2,4,3];not a bool}',
            expected: '[9,8,8,7,4,4,3,3,2,2,0]'
        },
        {
            code: '{sort;["as","dlah","j","","fliuka","ufhea","uik"];not a bool}',
            expected: '["uik","ufhea","j","fliuka","dlah","as",""]'
        },

        {
            code: '{sort;{get;arr1}}',
            expected: '',
            subtags: [GetSubtag],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
            },
            async assert(bbctx, _, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' })).to.deep.equal(['this', 'is', 'arr1']);
                chai.expect((await bbctx.runtime.variables.get('arr1')).value).to.deep.equal(['arr1', 'is', 'this']);
            }
        },
        {
            code: '{sort;arr1}',
            expected: '',
            subtags: [GetSubtag],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
            },
            async assert(bbctx, _, ctx) {
                chai.expect(ctx.tagVariables.get({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' })).to.deep.equal(['this', 'is', 'arr1']);
                chai.expect((await bbctx.runtime.variables.get('arr1')).value).to.deep.equal(['arr1', 'is', 'this']);
            }
        },
        {
            code: '{sort;!arr1}',
            expected: '',
            subtags: [GetSubtag],
            setupSaveVariables: false,
            setup(ctx) {
                ctx.entrypoint.name = 'testTag';
                ctx.tagVariables.set({ scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' }, name: 'arr1' }, ['this', 'is', 'arr1']);
                ctx.variables.setup(m => m.set(argument.isDeepEqual([{ name: 'arr1', value: ['arr1', 'is', 'this'], scope: { type: TagVariableType.LOCAL_TAG, name: 'testTag' } }]))).thenResolve(undefined);
            },
            async assert(bbctx) {
                chai.expect((await bbctx.runtime.variables.get('arr1')).value).to.deep.equal(['arr1', 'is', 'this']);
            }
        }
    ]
});
