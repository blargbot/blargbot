import { GuildNameSubtag } from '@blargbot/bbtag/subtags/guild/guildname';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new GuildNameSubtag(),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: `{guildname}`,
            expected: `My super cool guild`,
            setup(ctx) {
                ctx.guild.name = `My super cool guild`;
            }
        }
    ]
});
