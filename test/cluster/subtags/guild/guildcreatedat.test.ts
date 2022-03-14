import { GuildCreatedAtSubtag } from '@blargbot/cluster/subtags/guild/guildcreatedat';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new GuildCreatedAtSubtag(),
    argCountBounds: { min: 0, max: 1 },
    setup(ctx) {
        ctx.guild.id = '417411399422312468';
        ctx.roles.everyone.id = ctx.guild.id;
        ctx.message.guild_id = ctx.guild.id;
    },
    cases: [
        { code: '{guildcreatedat}', expected: '2018-02-25T20:03:52Z' },
        { code: '{guildcreatedat;}', expected: '2018-02-25T20:03:52Z' },
        { code: '{guildcreatedat;X}', expected: '1519589032' },
        { code: '{guildcreatedat;DD/MM/YYYY}', expected: '25/02/2018' }
    ]
});
