import { GuildIdSubtag } from '@blargbot/bbtag/subtags/guild/guildId.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: new GuildIdSubtag(),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{guildid}',
            expected: '239874239478293234',
            setup(ctx) {
                ctx.guild.id = '239874239478293234';
                ctx.roles.everyone.id = ctx.guild.id;
                ctx.channels.command.guild_id = ctx.guild.id;
            }
        }
    ]
});
