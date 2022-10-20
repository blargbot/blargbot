import { GuildIconSubtag } from '@blargbot/bbtag/subtags/guild/guildicon';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new GuildIconSubtag(),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{guildicon}',
            expected: 'https://cdn.discordapp.com/icons/2387612328973643892746/myCoolIcon.png?size=512',
            setup(ctx) {
                ctx.discordOptions.defaultImageFormat = 'png';
                ctx.discordOptions.defaultImageSize = 512;
                ctx.guild.id = '2387612328973643892746';
                ctx.roles.everyone.id = ctx.guild.id;
                ctx.channels.command.guild_id = ctx.guild.id;
                ctx.guild.icon = 'myCoolIcon';
            }
        },
        {
            code: '{guildicon}',
            expected: '',
            setup(ctx) {
                ctx.guild.icon = null;
            }
        }
    ]
});
