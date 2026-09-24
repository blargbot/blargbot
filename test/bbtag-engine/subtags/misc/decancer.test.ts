import { replacers } from '@blargbot/bbtag-engine';
import limax from 'limax';
import unorm from 'unorm';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.decancerReplacer,
    argCountBounds: { min: 1, max: 1 },
    setup(ctx) {
        ctx.locals.setup(m => m.decancer).returns(value => {
            const opt = {
                tone: false,
                separateNumbers: false,
                separateApostrophes: false,
                maintainCase: true,
                custom: Array.from('., !\'"?0123456789'),
                replacement: '\u200b'
            };
            return unorm.nfkd(value)
                .replace(/[^ ]+/g, text => limax(text, opt))
                .replaceAll(opt.replacement, '');
        });
    },
    cases: [
        { code: '{decancer;\u200bḩ̸̪̓̍a̶̗̤̎́h̵͉͓͗̀ā̷̜̼̄ ̷̧̓í̴̯̎m̵͚̜̽ ̸̛̝ͅs̴͚̜̈o̴̦̗̊ ̷͎͋ȩ̵͐d̶͎̂̇g̴̲͓̀͝y̶̠̓̿}', expected: 'haha im so edgy' }
    ]
});
