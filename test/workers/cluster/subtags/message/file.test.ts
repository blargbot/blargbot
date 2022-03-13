import { FileSubtag } from '@cluster/subtags/message/file';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new FileSubtag(),
    argCountBounds: { min: 2, max: 2 },
    cases: [
        {
            code: '{file;abcdef;def}',
            expected: '',
            assert(ctx) {
                expect(ctx.data.file).to.not.be.undefined.and.not.be.null;
                expect(ctx.data.file?.file).to.equal('abcdef');
                expect(ctx.data.file?.name).to.equal('def');
            }
        },
        {
            code: '{file;buffer:abcdef;def}',
            expected: '',
            assert(ctx) {
                expect(ctx.data.file).to.not.be.undefined.and.not.be.null;
                expect(ctx.data.file?.file).to.be.instanceOf(Buffer).and.to.equalBytes([0x69, 0xb7, 0x1d, 0x79]);
                expect(ctx.data.file?.name).to.equal('def');
            }
        },
        {
            code: '{file;Buffer:abcdef;def}',
            expected: '',
            assert(ctx) {
                expect(ctx.data.file).to.not.be.undefined.and.not.be.null;
                expect(ctx.data.file?.file).to.equal('Buffer:abcdef');
                expect(ctx.data.file?.name).to.equal('def');
            }
        }
    ]
});
