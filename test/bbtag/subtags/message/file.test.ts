import assert from 'node:assert/strict';

import { FileSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new FileSubtag(),
    argCountBounds: { min: 2, max: 2 },
    names: ['file'],
    cases: [
        {
            code: '{file;abcdef;def}',
            expected: '',
            assert(ctx) {
                assert.deepEqual(ctx.root.output.files, [{
                    file: Buffer.from('abcdef'),
                    name: 'def'
                }]);
            }
        },
        {
            code: '{file;buffer:abcdef;def}',
            expected: '',
            assert(ctx) {
                assert.deepEqual(ctx.root.output.files, [{
                    file: Buffer.from('abcdef', 'base64'),
                    name: 'def'
                }]);
            }
        },
        {
            code: '{file;Buffer:abcdef;def}',
            expected: '',
            assert(ctx) {
                assert.deepEqual(ctx.root.output.files, [{
                    file: Buffer.from('Buffer:abcdef'),
                    name: 'def'
                }]);
            }
        }
    ]
});
