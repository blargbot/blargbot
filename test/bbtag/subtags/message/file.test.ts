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
                assert.notEqual(ctx.root.output.files, undefined);
                assert.equal(ctx.root.output.files?.[0]?.file, 'abcdef');
                assert.equal(ctx.root.output.files[0].name, 'def');
            }
        },
        {
            code: '{file;buffer:abcdef;def}',
            expected: '',
            assert(ctx) {
                assert.notEqual(ctx.root.output.files, undefined);
                assert.equal(ctx.root.output.files?.[0]?.name, 'def');
                const actual = Buffer.from(ctx.root.output.files[0].file).toString();
                const expected = Buffer.from([0x69, 0xb7, 0x1d, 0x79]).toString();
                assert.equal(actual, expected);
            }
        },
        {
            code: '{file;Buffer:abcdef;def}',
            expected: '',
            assert(ctx) {
                assert.deepEqual(ctx.root.output.files, [{ file: 'Buffer:abcdef', name: 'def' }]);
            }
        }
    ]
});
