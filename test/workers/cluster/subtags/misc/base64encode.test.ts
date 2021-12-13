import { NotEnoughArgumentsError } from '@cluster/bbtag/errors';
import { Base64EncodeSubtag } from '@cluster/subtags/misc/base64encode';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new Base64EncodeSubtag(),
    cases: [
        {
            code: '{base64encode}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 14, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        {
            code: '{base64encode;Success!}',
            expected: 'U3VjY2VzcyE='
        },
        {
            code: '{base64encode;I dont like that it passes here;#This is ignored#}',
            expected: 'SSBkb250IGxpa2UgdGhhdCBpdCBwYXNzZXMgaGVyZQ=='
        },
        {
            code: '{base64encode;I dont like that it passes here;1;2;3;4;5;6;7;8}',
            expected: 'SSBkb250IGxpa2UgdGhhdCBpdCBwYXNzZXMgaGVyZQ=='
        },
        {
            code: '{btoa}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 6, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        {
            code: '{btoa;Success!}',
            expected: 'U3VjY2VzcyE='
        },
        {
            code: '{btoa;I dont like that it passes here;#This is ignored#}',
            expected: 'SSBkb250IGxpa2UgdGhhdCBpdCBwYXNzZXMgaGVyZQ=='
        },
        {
            code: '{btoa;I dont like that it passes here;1;2;3;4;5;6;7;8}',
            expected: 'SSBkb250IGxpa2UgdGhhdCBpdCBwYXNzZXMgaGVyZQ=='
        }
    ]
});
