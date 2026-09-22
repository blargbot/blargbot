import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.decancerReplacer,
    argCountBounds: { min: 1, max: 1 },
    cases: [
        { code: '{decancer;ḩ̸̪̓̍a̶̗̤̎́h̵͉͓͗̀ā̷̜̼̄ ̷̧̓í̴̯̎m̵͚̜̽ ̸̛̝ͅs̴͚̜̈o̴̦̗̊ ̷͎͋ȩ̵͐d̶͎̂̇g̴̲͓̀͝y̶̠̓̿}', expected: 'haha im so edgy', retries: 1 }
    ]
});
