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
                expect(ctx.state.file).to.not.be.undefined.and.not.be.null;
                expect(ctx.state.file?.file).to.equal('abcdef');
                expect(ctx.state.file?.name).to.equal('def');
            }
        },
        {
            code: '{file;buffer:abcdef;def}',
            expected: '',
            assert(ctx) {
                expect(ctx.state.file).to.not.be.undefined.and.not.be.null;
                expect(ctx.state.file?.file).to.be.instanceOf(Buffer).and.to.equalBytes([0x69, 0xb7, 0x1d, 0x79]);
                expect(ctx.state.file?.name).to.equal('def');
            }
        },
        {
            code: '{file;Buffer:abcdef;def}',
            expected: '',
            assert(ctx) {
                expect(ctx.state.file).to.not.be.undefined.and.not.be.null;
                expect(ctx.state.file?.file).to.equal('Buffer:abcdef');
                expect(ctx.state.file?.name).to.equal('def');
            }
        }
    ]
});
