import assert from 'node:assert/strict';

import { FileSubtag } from '@blargbot/bbtag/subtags/message/file.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new FileSubtag(),
    argCountBounds: { min: 2, max: 2 },
    cases: [
        {
            code: '{file;abcdef;def}',
            expected: '',
            assert(ctx) {
                assert.notEqual(ctx.data.file, undefined);
                assert.equal(ctx.data.file?.file, 'abcdef');
                assert.equal(ctx.data.file.name, 'def');
            }
        },
        {
            code: '{file;buffer:abcdef;def}',
            expected: '',
            assert(ctx) {
                assert.notEqual(ctx.data.file, undefined);
                assert.equal(ctx.data.file?.name, 'def');
                const actual = Buffer.from(ctx.data.file.file).toString();
                const expected = Buffer.from([0x69, 0xb7, 0x1d, 0x79]).toString();
                assert.equal(actual, expected);
            }
        },
        {
            code: '{file;Buffer:abcdef;def}',
            expected: '',
            assert(ctx) {
                assert.notEqual(ctx.data.file, undefined);
                assert.equal(ctx.data.file?.file, 'Buffer:abcdef');
                assert.equal(ctx.data.file.name, 'def');
            }
        }
    ]
});
