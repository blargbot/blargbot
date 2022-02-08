import { GuildIdSubtag } from '@cluster/subtags/guild/guildid';

import { runSubtagTests } from '../SubtagTestSuite';

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
                ctx.message.guild_id = ctx.guild.id;
            }
        }
    ]
});
