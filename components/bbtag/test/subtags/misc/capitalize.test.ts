import { Subtag } from '@blargbot/bbtag';
import { CapitalizeSubtag } from '@blargbot/bbtag/subtags/misc/capitalize.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(CapitalizeSubtag),
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
