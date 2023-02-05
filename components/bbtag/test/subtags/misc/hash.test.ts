import { BBTagRuntimeError, Subtag } from '@bbtag/blargbot';
import { HashSubtag } from '@bbtag/blargbot/subtags';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

function hashMissing(algorithm: string): boolean {
    return !HashSubtag.methods.includes(algorithm);
}

runSubtagTests({
    subtag: Subtag.getDescriptor(HashSubtag),
    argCountBounds: { min: 1, max: 2 },
    cases: [
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
                { start: 14, end: 20, error: new MarkerError('eval', 14) },
                { start: 0, end: 21, error: new BBTagRuntimeError('Unsupported hash', 'invalid is not a supported hash algorithm') }
            ]
        }
    ]
});
