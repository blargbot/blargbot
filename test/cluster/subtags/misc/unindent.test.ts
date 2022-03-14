import { UnindentSubtag } from '@blargbot/cluster/subtags/misc/unindent';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new UnindentSubtag(),
    argCountBounds: { min: 1, max: 2 },
    cases: [
        { code: '{unindent;this is a test:\n    1. abc\n      a. 123\n    2. xyz\n    3. aaaa}', expected: 'this is a test:\n1. abc\n  a. 123\n2. xyz\n3. aaaa' },
        { code: '{unindent;this is a test:\n    1. abc\n      a. 123\n    2. xyz\n    3. aaaa;2}', expected: 'this is a test:\n  1. abc\n    a. 123\n  2. xyz\n  3. aaaa' },
        { code: '{unindent;this is a test:\n    1. abc\n      a. 123\n    2. xyz\n    3. aaaa;xyz}', expected: 'this is a test:\n1. abc\n  a. 123\n2. xyz\n3. aaaa' },
        { code: '{unindent;hello!}', expected: 'hello!' },
        { code: '{unindent;hello!;2}', expected: 'hello!' }
    ]
});
