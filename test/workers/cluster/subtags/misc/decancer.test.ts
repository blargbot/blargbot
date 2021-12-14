import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { DecancerSubtag } from '@cluster/subtags/misc/decancer';

import { runSubtagTests, TestError } from '../SubtagTestSuite';

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
            code: '{decancer;{error};{error}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 10, end: 17, error: new TestError(10) },
                { start: 18, end: 25, error: new TestError(18) },
                { start: 0, end: 26, error: new TooManyArgumentsError(1, 2) }
            ]
        }
    ]
});
