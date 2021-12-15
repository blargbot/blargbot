import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { DecancerSubtag } from '@cluster/subtags/misc/decancer';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new DecancerSubtag(),
    cases: [
        {
            code: '{decancer}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 10, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        { code: '{decancer;ḩ̸̪̓̍a̶̗̤̎́h̵͉͓͗̀ā̷̜̼̄ ̷̧̓í̴̯̎m̵͚̜̽ ̸̛̝ͅs̴͚̜̈o̴̦̗̊ ̷͎͋ȩ̵͐d̶͎̂̇g̴̲͓̀͝y̶̠̓̿}', expected: 'haha im so edgy' },
        {
            code: '{decancer;{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 10, end: 16, error: new MarkerError('eval', 10) },
                { start: 17, end: 23, error: new MarkerError('eval', 17) },
                { start: 0, end: 24, error: new TooManyArgumentsError(1, 2) }
            ]
        }
    ]
});
