import { Subtag } from '@blargbot/bbtag';
import { GuildCreatedAtSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(GuildCreatedAtSubtag),
    argCountBounds: { min: 0, max: 1 },
    setupEach(ctx) {
        ctx.guild.id = '417411399422312468';
        ctx.roles.everyone.id = ctx.guild.id;
        ctx.channels.command.guild_id = ctx.guild.id;
    },
    cases: [
        { code: '{guildcreatedat}', expected: '2018-02-25T20:03:52Z' },
        { code: '{guildcreatedat;}', expected: '2018-02-25T20:03:52Z' },
        { code: '{guildcreatedat;X}', expected: '1519589032' },
        { code: '{guildcreatedat;DD/MM/YYYY}', expected: '25/02/2018' }
    ]
});
