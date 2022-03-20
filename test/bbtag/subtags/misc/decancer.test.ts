import { DecancerSubtag } from '@blargbot/bbtag/subtags/misc/decancer';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new DecancerSubtag(),
    argCountBounds: { min: 1, max: 1 },
    cases: [
        { code: '{decancer;ḩ̸̪̓̍a̶̗̤̎́h̵͉͓͗̀ā̷̜̼̄ ̷̧̓í̴̯̎m̵͚̜̽ ̸̛̝ͅs̴͚̜̈o̴̦̗̊ ̷͎͋ȩ̵͐d̶͎̂̇g̴̲͓̀͝y̶̠̓̿}', expected: 'haha im so edgy', retries: 1 }
    ]
});
