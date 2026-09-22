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
                ctx.util.setup(m => m.defaultPrefix, false).thenReturn('b!');
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'prefix')).thenResolve(undefined);
            }
        },
        {
            code: '{prefix}',
            expected: 'abc',
            setup(ctx) {
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'prefix')).thenResolve('abc' as unknown as string[]);
            }
        },
        {
            code: '{prefix}',
            expected: 'def',
            setup(ctx) {
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'prefix')).thenResolve(['def', 'ghi']);
            }
        },
        {
            code: '{prefix}',
            expected: 'ghi',
            setup(ctx) {
                ctx.options.prefix = 'ghi';
            }
        }
    ]
});
