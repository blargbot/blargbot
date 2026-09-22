import assert from 'node:assert/strict';

import { EmbedSubtag, EscapeBBTagSubtag } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.embedReplacer,
    argCountBounds: { min: 1, max: Infinity },
    cases: [
        {
            code: '{embed;{escapebbtag;{"title":"Hello!"}}}',
            subtags: [replacers.escapeBBTagReplacer],
            expected: '',
            assert(ctx) {
                assert.deepEqual(ctx.data.embeds, [
                    { title: 'Hello!' }
                ]);
            }
        },
        {
            code: '{embed;{escapebbtag;{"title":"Hello!"}};{escapebbtag;{"author":{ "name": "abc" }}}}',
            subtags: [replacers.escapeBBTagReplacer],
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
            subtags: [replacers.escapeBBTagReplacer],
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
            subtags: [replacers.escapeBBTagReplacer],
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
