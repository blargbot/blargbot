import { BBTagRuntimeError, NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { HashSubtag, supportedHashes } from '@cluster/subtags/misc/hash';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

function hashMissing(algorithm: string): boolean {
    return !supportedHashes.includes(algorithm);
}

runSubtagTests({
    subtag: new HashSubtag(),
    cases: [
        {
            code: '{hash}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 6, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        { code: '{hash;brown}', expected: '94011702' },
        { code: '{hash;}', expected: '0' },
        { code: '{hash;md5;text:some cool text here}', expected: 'dc15a13d3e070e8151301f4430d214e7', skip: hashMissing('md5') },
        { code: '{hash;md5;some cool text here}', expected: 'dc15a13d3e070e8151301f4430d214e7', skip: hashMissing('md5') },
        { code: '{hash;md5;buffer:SomeBase64String}', expected: '9d8439a562db5d220f907c01520455da', skip: hashMissing('md5') },
        { code: '{hash;md5;buffer:c29tZSBjb29sIHRleHQgaGVyZQ==}', expected: 'dc15a13d3e070e8151301f4430d214e7', skip: hashMissing('md5') },
        { code: '{hash;sha256;text:some cool text here}', expected: 'f7c359d5b79ff70e9c4139ff9a7575a36159b45c4a7b2fc31f1287db74d11e89', skip: hashMissing('sha256') },
        { code: '{hash;sha256;some cool text here}', expected: 'f7c359d5b79ff70e9c4139ff9a7575a36159b45c4a7b2fc31f1287db74d11e89', skip: hashMissing('sha256') },
        { code: '{hash;sha256;buffer:SomeBase64String}', expected: 'ece380ed4d838870866f62e894306a574673ead5148e97c89c820780ed42b004', skip: hashMissing('sha256') },
        { code: '{hash;sha256;buffer:c29tZSBjb29sIHRleHQgaGVyZQ==}', expected: 'f7c359d5b79ff70e9c4139ff9a7575a36159b45c4a7b2fc31f1287db74d11e89', skip: hashMissing('sha256') },
        {
            code: '{hash;invalid;{eval}}',
            expected: '`Unsupported hash`',
            errors: [
                { start: 14, end: 20, error: new MarkerError(14) },
                { start: 0, end: 21, error: new BBTagRuntimeError('Unsupported hash', 'invalid is not a supported hash algorithm') }
            ]
        },
        {
            code: '{hash;{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 6, end: 12, error: new MarkerError(6) },
                { start: 13, end: 19, error: new MarkerError(13) },
                { start: 20, end: 26, error: new MarkerError(20) },
                { start: 0, end: 27, error: new TooManyArgumentsError(2, 3) }
            ]
        }
    ]
});
