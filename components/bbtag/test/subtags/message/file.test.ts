import { Subtag } from '@blargbot/bbtag';
import { FileSubtag } from '@blargbot/bbtag/subtags/message/file.js';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(FileSubtag),
    argCountBounds: { min: 2, max: 2 },
    cases: [
        {
            code: '{file;abcdef;def}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.data.file).to.not.be.undefined.and.not.be.null;
                chai.expect(ctx.data.file?.file).to.equal('YWJjZGVm');
                chai.expect(ctx.data.file?.name).to.equal('def');
            }
        },
        {
            code: '{file;buffer:abcdef;def}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.data.file).to.not.be.undefined.and.not.be.null;
                chai.expect(ctx.data.file?.file).to.equal('abcdef');
                chai.expect(ctx.data.file?.name).to.equal('def');
            }
        },
        {
            code: '{file;Buffer:abcdef;def}',
            expected: '',
            assert(ctx) {
                chai.expect(ctx.data.file).to.not.be.undefined.and.not.be.null;
                chai.expect(ctx.data.file?.file).to.equal('QnVmZmVyOmFiY2RlZg==');
                chai.expect(ctx.data.file?.name).to.equal('def');
            }
        }
    ]
});
