import { LowerSubtag } from '@blargbot/bbtag/subtags/misc/lower';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new LowerSubtag(),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        { code: `{lower;}`, expected: `` },
        { code: `{lower;AbC}`, expected: `abc` },
        { code: `{lower;This Is A Test}`, expected: `this is a test` },
        { code: `{lower;ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyz}`, expected: `abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz` }
    ]
});
