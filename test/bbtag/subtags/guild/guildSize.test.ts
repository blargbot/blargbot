import { GuildSizeSubtag } from '@blargbot/bbtag/subtags/guild/guildSize.js';
import { snowflake } from '@blargbot/core/utils/index.js';
import * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new GuildSizeSubtag(),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{guildsize}',
            expected: '123',
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.ensureMemberCache(bbctx.guild))
                    .thenCall(() => {
                        for (let i = bbctx.guild.members.size; i < 123; i++)
                            bbctx.guild.members.add(new eris.Member({ id: snowflake.create().toString() }));
                    })
                    .thenResolve(undefined);

            }
        }
    ]
});
