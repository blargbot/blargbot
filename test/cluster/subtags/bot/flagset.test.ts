import { FlagSetSubtag } from '@blargbot/cluster/subtags/bot/flagset';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new FlagSetSubtag(),
    argCountBounds: { min: 1, max: 1 },
    setup(ctx) {
        ctx.options.inputRaw = 'This is some text -a flag a content -bc flag c content -- some more text --extra flag extra content --else flag else content';
        ctx.options.flags = [
            {
                description: '',
                flag: 'e',
                word: 'extra'
            },
            {
                description: '',
                flag: 'E',
                word: 'else'
            }
        ];
    },
    cases: [
        { code: '{flagset;1}', expected: 'false' },
        { code: '{flagset;a}', expected: 'true' },
        { code: '{flagset;A}', expected: 'false' },
        { code: '{flagset;b}', expected: 'true' },
        { code: '{flagset;c}', expected: 'true' },
        { code: '{flagset;d}', expected: 'false' },
        { code: '{flagset;e}', expected: 'true' },
        { code: '{flagset;E}', expected: 'true' }
    ]
});
