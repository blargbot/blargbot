import { NotEnoughArgumentsError } from '@cluster/bbtag/errors';
import { EmbedSubtag } from '@cluster/subtags/message/embed';
import { EscapeBbtagSubtag } from '@cluster/subtags/misc/escapebbtag';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new EmbedSubtag(),
    cases: [
        {
            code: '{embed}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 7, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        {
            code: '{embed;{escapebbtag;{"title":"Hello!"}}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '',
            assert(ctx) {
                expect(ctx.state.embeds).to.deep.equal([
                    { title: 'Hello!' }
                ]);
            }
        },
        {
            code: '{embed;{escapebbtag;{"title":"Hello!"}};{escapebbtag;{"author":{ "name": "abc" }}}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '',
            assert(ctx) {
                expect(ctx.state.embeds).to.deep.equal([
                    { title: 'Hello!' },
                    { author: { name: 'abc' } }
                ]);
            }
        },
        {
            code: '{embed;{escapebbtag;{"title":"Hello!"}};{escapebbtag;{"title": false}}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '',
            assert(ctx) {
                expect(ctx.state.embeds).to.deep.equal([
                    { title: 'Hello!' },
                    { fields: [{ name: 'Malformed JSON', value: '{"title":false}' }], malformed: true }
                ]);
            }
        },
        {
            code: '{embed;{escapebbtag;{"title":"Hello!"}};{escapebbtag;{"author":{ "name": "abc" }}};{escapebbtag;[{"title":"embed array 1"}, {"title": "embed array 2"}]}}',
            subtags: [new EscapeBbtagSubtag()],
            expected: '',
            assert(ctx) {
                expect(ctx.state.embeds).to.deep.equal([
                    { title: 'Hello!' },
                    { author: { name: 'abc' } },
                    { title: 'embed array 1' },
                    { title: 'embed array 2' }
                ]);
            }
        }
    ]
});
