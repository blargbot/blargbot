import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { CapitalizeSubtag } from '@cluster/subtags/misc/capitalize';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new CapitalizeSubtag(),
    cases: [
        {
            code: '{capitalize}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 12, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
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
        },
        {
            code: '{capitalize;{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 12, end: 18, error: new MarkerError(12) },
                { start: 19, end: 25, error: new MarkerError(19) },
                { start: 26, end: 32, error: new MarkerError(26) },
                { start: 0, end: 33, error: new TooManyArgumentsError(2, 3) }
            ]
        }
    ]
});
