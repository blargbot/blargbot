import { EmbedSubtag, EscapeBBTagSubtag } from '@bbtag/blargbot/subtags';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: EmbedSubtag,
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        {
            code: '{embed;{escapebbtag;{"title":"Hello!"}}}',
            subtags: [EscapeBBTagSubtag],
            expected: '',
            assert(ctx) {
                chai.expect(ctx.runtime.outputOptions.embeds).to.deep.equal([
                    { title: 'Hello!' }
                ]);
            }
        },
        {
            code: '{embed;{escapebbtag;{"title":"Hello!"}};{escapebbtag;{"author":{ "name": "abc" }}}}',
            subtags: [EscapeBBTagSubtag],
            expected: '',
            assert(ctx) {
                chai.expect(ctx.runtime.outputOptions.embeds).to.deep.equal([
                    { title: 'Hello!' },
                    { author: { name: 'abc' } }
                ]);
            }
        },
        {
            code: '{embed;{escapebbtag;{"title":"Hello!"}};{escapebbtag;{"title": false}}}',
            subtags: [EscapeBBTagSubtag],
            expected: '',
            assert(ctx) {
                chai.expect(ctx.runtime.outputOptions.embeds).to.deep.equal([
                    { title: 'Hello!' },
                    { fields: [{ name: 'Malformed JSON', value: '{"title":false}' }] }
                ]);
            }
        },
        {
            code: '{embed;{escapebbtag;{"title":"Hello!"}};{escapebbtag;{"author":{ "name": "abc" }}};{escapebbtag;[{"title":"embed array 1"}, {"title": "embed array 2"}]}}',
            subtags: [EscapeBBTagSubtag],
            expected: '',
            assert(ctx) {
                chai.expect(ctx.runtime.outputOptions.embeds).to.deep.equal([
                    { title: 'Hello!' },
                    { author: { name: 'abc' } },
                    { title: 'embed array 1' },
                    { title: 'embed array 2' }
                ]);
            }
        }
    ]
});
