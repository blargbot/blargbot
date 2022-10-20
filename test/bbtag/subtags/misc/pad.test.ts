import { BBTagRuntimeError } from '@blargbot/bbtag/errors';
import { PadSubtag } from '@blargbot/bbtag/subtags/misc/pad';
import { expect } from 'chai';
import { it } from 'mocha';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new PadSubtag(),
    argCountBounds: { min: 3, max: 3 },
    cases: [
        { code: '{pad;left;;}', expected: '' },
        { code: '{pad;right;;}', expected: '' },
        { code: '{pad;left;000000;}', expected: '000000' },
        { code: '{pad;left;000000;A}', expected: '00000A' },
        { code: '{pad;left;000000;AB}', expected: '0000AB' },
        { code: '{pad;left;000000;ABC}', expected: '000ABC' },
        { code: '{pad;left;000000;ABCD}', expected: '00ABCD' },
        { code: '{pad;left;000000;ABCDE}', expected: '0ABCDE' },
        { code: '{pad;left;000000;ABCDEF}', expected: 'ABCDEF' },
        { code: '{pad;left;000000;ABCDEFG}', expected: 'ABCDEFG' },
        { code: '{pad;left;000000;ABCDEFGH}', expected: 'ABCDEFGH' },
        { code: '{pad;left;000000;ABCDEFGHI}', expected: 'ABCDEFGHI' },
        { code: '{pad;left;000000;ABCDEFGHIJ}', expected: 'ABCDEFGHIJ' },
        { code: '{pad;left;000000;ABCDEFGHIJK}', expected: 'ABCDEFGHIJK' },
        { code: '{pad;left;000000;ABCDEFGHIJKL}', expected: 'ABCDEFGHIJKL' },
        { code: '{pad;left;000000;ABCDEFGHIJKLM}', expected: 'ABCDEFGHIJKLM' },
        { code: '{pad;left;000000;ABCDEFGHIJKLMN}', expected: 'ABCDEFGHIJKLMN' },
        { code: '{pad;right;000000;}', expected: '000000' },
        { code: '{pad;right;000000;A}', expected: 'A00000' },
        { code: '{pad;right;000000;AB}', expected: 'AB0000' },
        { code: '{pad;right;000000;ABC}', expected: 'ABC000' },
        { code: '{pad;right;000000;ABCD}', expected: 'ABCD00' },
        { code: '{pad;right;000000;ABCDE}', expected: 'ABCDE0' },
        { code: '{pad;right;000000;ABCDEF}', expected: 'ABCDEF' },
        { code: '{pad;right;000000;ABCDEFG}', expected: 'ABCDEFG' },
        { code: '{pad;right;000000;ABCDEFGH}', expected: 'ABCDEFGH' },
        { code: '{pad;right;000000;ABCDEFGHI}', expected: 'ABCDEFGHI' },
        { code: '{pad;right;000000;ABCDEFGHIJ}', expected: 'ABCDEFGHIJ' },
        { code: '{pad;right;000000;ABCDEFGHIJK}', expected: 'ABCDEFGHIJK' },
        { code: '{pad;right;000000;ABCDEFGHIJKL}', expected: 'ABCDEFGHIJKL' },
        { code: '{pad;right;000000;ABCDEFGHIJKLM}', expected: 'ABCDEFGHIJKLM' },
        { code: '{pad;right;000000;ABCDEFGHIJKLMN}', expected: 'ABCDEFGHIJKLMN' },
        {
            code: '{pad;{eval}abc;{eval};{eval}}',
            expected: '`Invalid direction`',
            errors: [
                { start: 5, end: 11, error: new MarkerError('eval', 5) },
                { start: 15, end: 21, error: new MarkerError('eval', 15) },
                { start: 22, end: 28, error: new MarkerError('eval', 22) },
                { start: 0, end: 29, error: new BBTagRuntimeError('Invalid direction') }
            ]
        }
    ],
    runOtherTests(s) {
        it('Should be deprecated', () => {
            expect(s.deprecated).to.equal('realpad');
        });
    }
});
