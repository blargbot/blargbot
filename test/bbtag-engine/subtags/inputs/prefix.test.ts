import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.prefixReplacer,
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{prefix}',
            expected: 'b!',
            setup(ctx) {
                ctx.locals.setup(m => m.prefix).returns('b!').mustHappen();
            }
        }
        // TODO: Move this test once limits are reintroduced
        // {
        //     code: '{prefix}',
        //     expected: 'abc',
        //     setup(ctx) {
        //         ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'prefix')).thenResolve('abc' as unknown as string[]);
        //     }
        // },
        // {
        //     code: '{prefix}',
        //     expected: 'def',
        //     setup(ctx) {
        //         ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'prefix')).thenResolve(['def', 'ghi']);
        //     }
        // },
        // {
        //     code: '{prefix}',
        //     expected: 'ghi',
        //     setup(ctx) {
        //         ctx.options.prefix = 'ghi';
        //     }
        // }
    ]
});
