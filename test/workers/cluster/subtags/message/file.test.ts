import { NotEnoughArgumentsError } from '@cluster/bbtag/errors';
import { FileSubtag } from '@cluster/subtags/message/file';
import { expect } from 'chai';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new FileSubtag(),
    cases: [
        {
            code: '{file}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 6, error: new NotEnoughArgumentsError(2, 0) }
            ]
        },
        {
            code: '{file;{eval}}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 6, end: 12, error: new MarkerError('eval', 6) },
                { start: 0, end: 13, error: new NotEnoughArgumentsError(2, 1) }
            ]
        },
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
