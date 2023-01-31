import { Subtag } from '@blargbot/bbtag';
import { SemiSubtag, UriEncodeSubtag  } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(UriEncodeSubtag),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{uriencode;{semi},/?:@&=+$-_.!~*\'()#ABC abc 123}',
            expected: '%3B%2C%2F%3F%3A%40%26%3D%2B%24-_.!~*\'()%23ABC%20abc%20123',
            subtags: [Subtag.getDescriptor(SemiSubtag)]
        }
    ]
});