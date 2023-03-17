import { CapitalizeSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: CapitalizeSubtag,
    argCountBounds: { min: 1, max: 2 },
    cases: [
        {
            code: '{capitalize;this is a test}',
            expected: 'This is a test'
        },
        {
            code: '{capitalize;hELLO world}',
            expected: 'HELLO world'
        },
        {
            code: '{capitalize;hELLO WORLD;true}',
            expected: 'Hello world'
        },
        {
            code: '{capitalize;hello WORLD;anything goes here}',
            expected: 'Hello world'
        },
        {
            code: '{capitalize;foo BAR;}',
            expected: 'Foo bar'
        }
    ]
});
