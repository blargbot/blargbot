import assert from 'node:assert/strict';

import { EmbedSubtag } from '@blargbot/bbtag/subtags/message/embed.js';
import { EscapeBBTagSubtag } from '@blargbot/bbtag/subtags/misc/escapeBBTag.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new EmbedSubtag(),
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        {
            code: '{embed;{escapebbtag;{"title":"Hello!"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            assert(ctx) {
                assert.deepEqual(ctx.data.embeds, [
                    { title: 'Hello!' }
                ]);
            }
        },
        {
            code: '{embed;{escapebbtag;{"title":"Hello!"}};{escapebbtag;{"author":{ "name": "abc" }}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            assert(ctx) {
                assert.deepEqual(ctx.data.embeds, [
                    { title: 'Hello!' },
                    { author: { name: 'abc' } }
                ]);
            }
        },
        {
            code: '{embed;{escapebbtag;{"title":"Hello!"}};{escapebbtag;{"title": false}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            assert(ctx) {
                assert.deepEqual(ctx.data.embeds, [
                    { title: 'Hello!' },
                    { fields: [{ name: 'Malformed JSON', value: '{"title":false}' }], malformed: true }
                ]);
            }
        },
        {
            code: '{embed;{escapebbtag;{"title":"Hello!"}};{escapebbtag;{"author":{ "name": "abc" }}};{escapebbtag;[{"title":"embed array 1"}, {"title": "embed array 2"}]}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            assert(ctx) {
                assert.deepEqual(ctx.data.embeds, [
                    { title: 'Hello!' },
                    { author: { name: 'abc' } },
                    { title: 'embed array 1' },
                    { title: 'embed array 2' }
                ]);
            }
        }
    ]
});
