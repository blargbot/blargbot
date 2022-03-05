import { PrefixSubtag } from '@cluster/subtags/bot/prefix';
import { Configuration } from '@core/Configuration';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new PrefixSubtag(),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{prefix}',
            expected: 'b!',
            setup(ctx) {
                ctx.util.setup(m => m.config).thenReturn({
                    discord: { defaultPrefix: 'b!' }
                } as Partial<Configuration> as Configuration);

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
        }
    ]
});
