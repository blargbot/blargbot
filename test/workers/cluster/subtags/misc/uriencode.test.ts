import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { UriEncodeSubtag } from '@cluster/subtags/misc/uriencode';
import { SemiSubtag } from '@cluster/subtags/simple/semi';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new UriEncodeSubtag(),
    cases: [
        {
            code: '{uriencode}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 11, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        { code: '{uriencode;{semi},/?:@&=+$-_.!~*\'()#ABC abc 123}', expected: '%3B%2C%2F%3F%3A%40%26%3D%2B%24-_.!~*\'()%23ABC%20abc%20123', subtags: [new SemiSubtag()] },
        {
            code: '{uriencode;{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 11, end: 17, error: new MarkerError('eval', 11) },
                { start: 18, end: 24, error: new MarkerError('eval', 18) },
                { start: 0, end: 25, error: new TooManyArgumentsError(1, 2) }
            ]
        }
    ]
});
