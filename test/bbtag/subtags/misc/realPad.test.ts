import { BBTagRuntimeError, NotANumberError } from '@blargbot/bbtag/errors';
import { RealPadSubtag } from '@blargbot/bbtag/subtags/misc/realPad';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new RealPadSubtag(),
    argCountBounds: { min: 2, max: 4 },
    cases: [
        { code: '{realpad;;5}', expected: '     ' },
        { code: '{realpad;A;5}', expected: 'A    ' },
        { code: '{realpad;AB;5}', expected: 'AB   ' },
        { code: '{realpad;ABC;5}', expected: 'ABC  ' },
        { code: '{realpad;ABCD;5}', expected: 'ABCD ' },
        { code: '{realpad;ABCDE;5}', expected: 'ABCDE' },
        { code: '{realpad;ABCDEF;5}', expected: 'ABCDEF' },
        { code: '{realpad;;5;0}', expected: '00000' },
        { code: '{realpad;A;5;0}', expected: 'A0000' },
        { code: '{realpad;AB;5;0}', expected: 'AB000' },
        { code: '{realpad;ABC;5;0}', expected: 'ABC00' },
        { code: '{realpad;ABCD;5;0}', expected: 'ABCD0' },
        { code: '{realpad;ABCDE;5;0}', expected: 'ABCDE' },
        { code: '{realpad;ABCDEF;5;0}', expected: 'ABCDEF' },
        { code: '{realpad;;5;;right}', expected: '     ' },
        { code: '{realpad;A;5;;right}', expected: 'A    ' },
        { code: '{realpad;AB;5;;right}', expected: 'AB   ' },
        { code: '{realpad;ABC;5;;right}', expected: 'ABC  ' },
        { code: '{realpad;ABCD;5;;right}', expected: 'ABCD ' },
        { code: '{realpad;ABCDE;5;;right}', expected: 'ABCDE' },
        { code: '{realpad;ABCDEF;5;;right}', expected: 'ABCDEF' },
        { code: '{realpad;;5;;left}', expected: '     ' },
        { code: '{realpad;A;5;;left}', expected: '    A' },
        { code: '{realpad;AB;5;;left}', expected: '   AB' },
        { code: '{realpad;ABC;5;;left}', expected: '  ABC' },
        { code: '{realpad;ABCD;5;;left}', expected: ' ABCD' },
        { code: '{realpad;ABCDE;5;;left}', expected: 'ABCDE' },
        { code: '{realpad;ABCDEF;5;;left}', expected: 'ABCDEF' },
        { code: '{realpad;;5;1;right}', expected: '11111' },
        { code: '{realpad;A;5;1;right}', expected: 'A1111' },
        { code: '{realpad;AB;5;1;right}', expected: 'AB111' },
        { code: '{realpad;ABC;5;1;right}', expected: 'ABC11' },
        { code: '{realpad;ABCD;5;1;right}', expected: 'ABCD1' },
        { code: '{realpad;ABCDE;5;1;right}', expected: 'ABCDE' },
        { code: '{realpad;ABCDEF;5;1;right}', expected: 'ABCDEF' },
        { code: '{realpad;;5;2;left}', expected: '22222' },
        { code: '{realpad;A;5;2;left}', expected: '2222A' },
        { code: '{realpad;AB;5;2;left}', expected: '222AB' },
        { code: '{realpad;ABC;5;2;left}', expected: '22ABC' },
        { code: '{realpad;ABCD;5;2;left}', expected: '2ABCD' },
        { code: '{realpad;ABCDE;5;2;left}', expected: 'ABCDE' },
        { code: '{realpad;ABCDEF;5;2;left}', expected: 'ABCDEF' },
        {
            code: '{realpad;{eval};{eval}a}',
            expected: '`Not a number`',
            errors: [
                { start: 9, end: 15, error: new MarkerError('eval', 9) },
                { start: 16, end: 22, error: new MarkerError('eval', 16) },
                { start: 0, end: 24, error: new NotANumberError('a') }
            ]
        },
        {
            code: '{realpad;{eval};{eval}abc;{eval}xyz;{eval}up}',
            expected: '`Not a number`',
            errors: [
                { start: 9, end: 15, error: new MarkerError('eval', 9) },
                { start: 16, end: 22, error: new MarkerError('eval', 16) },
                { start: 26, end: 32, error: new MarkerError('eval', 26) },
                { start: 36, end: 42, error: new MarkerError('eval', 36) },
                { start: 0, end: 45, error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{realpad;{eval};{eval}5;{eval}xyz;{eval}up}',
            expected: '`Filler must be 1 character`',
            errors: [
                { start: 9, end: 15, error: new MarkerError('eval', 9) },
                { start: 16, end: 22, error: new MarkerError('eval', 16) },
                { start: 24, end: 30, error: new MarkerError('eval', 24) },
                { start: 34, end: 40, error: new MarkerError('eval', 34) },
                { start: 0, end: 43, error: new BBTagRuntimeError('Filler must be 1 character') }
            ]
        },
        {
            code: '{realpad;{eval};{eval}5;{eval}a;{eval}up}',
            expected: '`Invalid direction`',
            errors: [
                { start: 9, end: 15, error: new MarkerError('eval', 9) },
                { start: 16, end: 22, error: new MarkerError('eval', 16) },
                { start: 24, end: 30, error: new MarkerError('eval', 24) },
                { start: 32, end: 38, error: new MarkerError('eval', 32) },
                { start: 0, end: 41, error: new BBTagRuntimeError('Invalid direction', 'up is invalid') }
            ]
        }
    ]
});
