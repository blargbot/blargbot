import { FileSubtag } from '@blargbot/bbtag/subtags/message/file.js';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: new FileSubtag(),
    argCountBounds: { min: 2, max: 2 },
    cases: [
        {
            code: '{file;abcdef;def}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.data.file).to.not.be.undefined.and.not.be.null;
                chai.expect(ctx.data.file?.file).to.equal('abcdef');
                chai.expect(ctx.data.file?.name).to.equal('def');
            }
        },
        {
            code: '{file;buffer:abcdef;def}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.data.file).to.not.be.undefined.and.not.be.null;
                chai.expect(ctx.data.file?.file).to.be.instanceOf(Buffer).and.to.equalBytes([0x69, 0xb7, 0x1d, 0x79]);
                chai.expect(ctx.data.file?.name).to.equal('def');
            }
        },
        {
            code: '{file;Buffer:abcdef;def}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.data.file).to.not.be.undefined.and.not.be.null;
                chai.expect(ctx.data.file?.file).to.equal('Buffer:abcdef');
                chai.expect(ctx.data.file?.name).to.equal('def');
            }
        }
    ]
});
