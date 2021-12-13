import { NotEnoughArgumentsError } from '@cluster/bbtag/errors';
import { Base64DecodeSubtag } from '@cluster/subtags/misc/base64decode';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new Base64DecodeSubtag(),
    cases: [
        {
            code: '{base64decode}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 14, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        {
            code: '{base64decode;U3VjY2VzcyE}',
            expected: 'Success!'
        },
        {
            code: '{base64decode;U3VjY2VzcyE=}',
            expected: 'Success!'
        },
        {
            code: '{base64decode;SSBkb250IGxpa2UgdGhhdCBpdCBwYXNzZXMgaGVyZQ==;#This isnt valid base 64#}',
            expected: 'I dont like that it passes here'
        },
        {
            code: '{base64decode;SSBkb250IGxpa2UgdGhhdCBpdCBwYXNzZXMgaGVyZQ==;1;2;3;4;5;6;7;8}',
            expected: 'I dont like that it passes here'
        },
        {
            code: '{atob}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 6, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        {
            code: '{atob;U3VjY2VzcyE}',
            expected: 'Success!'
        },
        {
            code: '{atob;U3VjY2VzcyE=}',
            expected: 'Success!'
        },
        {
            code: '{atob;SSBkb250IGxpa2UgdGhhdCBpdCBwYXNzZXMgaGVyZQ==;#This isnt valid base 64#}',
            expected: 'I dont like that it passes here'
        },
        {
            code: '{atob;SSBkb250IGxpa2UgdGhhdCBpdCBwYXNzZXMgaGVyZQ==;1;2;3;4;5;6;7;8}',
            expected: 'I dont like that it passes here'
        }
    ]
});
