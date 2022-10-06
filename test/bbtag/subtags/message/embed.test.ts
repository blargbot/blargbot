import { EmbedSubtag } from '@blargbot/bbtag/subtags/message/embed';
import { EscapeBbtagSubtag } from '@blargbot/bbtag/subtags/misc/escapebbtag';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new EmbedSubtag(),
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        {
            code: `{embed;{escapebbtag;{"title":"Hello!"}}}`,
            subtags: [new EscapeBbtagSubtag()],
            expected: ``,
            assert(ctx) {
                expect(ctx.data.embeds).to.deep.equal([
                    { title: `Hello!` }
                ]);
            }
        },
        {
            code: `{embed;{escapebbtag;{"title":"Hello!"}};{escapebbtag;{"author":{ "name": "abc" }}}}`,
            subtags: [new EscapeBbtagSubtag()],
            expected: ``,
            assert(ctx) {
                expect(ctx.data.embeds).to.deep.equal([
                    { title: `Hello!` },
                    { author: { name: `abc` } }
                ]);
            }
        },
        {
            code: `{embed;{escapebbtag;{"title":"Hello!"}};{escapebbtag;{"title": false}}}`,
            subtags: [new EscapeBbtagSubtag()],
            expected: ``,
            assert(ctx) {
                expect(ctx.data.embeds).to.deep.equal([
                    { title: `Hello!` },
                    { fields: [{ name: `Malformed JSON`, value: `{"title":false}` }], malformed: true }
                ]);
            }
        },
        {
            code: `{embed;{escapebbtag;{"title":"Hello!"}};{escapebbtag;{"author":{ "name": "abc" }}};{escapebbtag;[{"title":"embed array 1"}, {"title": "embed array 2"}]}}`,
            subtags: [new EscapeBbtagSubtag()],
            expected: ``,
            assert(ctx) {
                expect(ctx.data.embeds).to.deep.equal([
                    { title: `Hello!` },
                    { author: { name: `abc` } },
                    { title: `embed array 1` },
                    { title: `embed array 2` }
                ]);
            }
        }
    ]
});
