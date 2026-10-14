import { GuildSizeSubtag } from '@blargbot/bbtag/subtags';
import { snowflake } from '@blargbot/core';
import * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new GuildSizeSubtag(),
    argCountBounds: { min: 0, max: 0 },
    names: ['guildSize', 'inGuild'],
    cases: [
        {
            code: '{guildsize}',
            expected: '123',
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.ensureMemberCache(bbctx.local.message.channel.guild))
                    .invokesAsync(() => {
                        for (let i = bbctx.local.message.channel.guild.members.size; i < 123; i++)
                            bbctx.local.message.channel.guild.members.add(new eris.Member({ id: snowflake.create().toString() }));
                    })
                    .resolves(undefined);

            }
        }
    ]
});
