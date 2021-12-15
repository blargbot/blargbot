import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { Md5Subtag } from '@cluster/subtags/misc/md5';
import { expect } from 'chai';
import { it } from 'mocha';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new Md5Subtag(),
    cases: [
        {
            code: '{md5}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 5, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        { code: '{md5;some cool text here}', expected: 'dc15a13d3e070e8151301f4430d214e7' },
        {
            code: '{md5;{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 5, end: 11, error: new MarkerError('eval', 5) },
                { start: 12, end: 18, error: new MarkerError('eval', 12) },
                { start: 0, end: 19, error: new TooManyArgumentsError(1, 2) }
            ]
        }
    ],
    runOtherTests(md5) {
        it('Should be deprecated', () => {
            expect(md5.deprecated).to.equal('hash');
        });
    }
});
