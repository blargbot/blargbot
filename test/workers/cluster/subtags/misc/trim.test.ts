import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { SpaceSubtag } from '@cluster/subtags/misc/space';
import { TrimSubtag } from '@cluster/subtags/misc/trim';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new TrimSubtag(),
    cases: [
        {
            code: '{trim}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 6, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        { code: '{trim;abc}', expected: 'abc' },
        { code: '{trim;   def   }', expected: 'def' },
        { code: '{trim;{space;10}ghi{space;10}}', expected: 'ghi', subtags: [new SpaceSubtag()] },
        {
            code: '{trim;{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 6, end: 12, error: new MarkerError('eval', 6) },
                { start: 13, end: 19, error: new MarkerError('eval', 13) },
                { start: 0, end: 20, error: new TooManyArgumentsError(1, 2) }
            ]
        }
    ]
});
