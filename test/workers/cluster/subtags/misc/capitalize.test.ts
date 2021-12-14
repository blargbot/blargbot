import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { CapitalizeSubtag } from '@cluster/subtags/misc/capitalize';

import { runSubtagTests, TestError } from '../SubtagTestSuite';

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
            code: '{capitalize;{error};{error};{error}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 12, end: 19, error: new TestError(12) },
                { start: 20, end: 27, error: new TestError(20) },
                { start: 28, end: 35, error: new TestError(28) },
                { start: 0, end: 36, error: new TooManyArgumentsError(2, 3) }
            ]
        }
    ]
});
