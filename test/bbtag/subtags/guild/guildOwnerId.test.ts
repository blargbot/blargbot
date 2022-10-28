import { GuildOwnerIdSubtag } from '@blargbot/bbtag/subtags/guild/guildOwnerId';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new GuildOwnerIdSubtag(),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{guildownerid}',
            expected: '2389476284936446234',
            setup(ctx) {
                ctx.guild.owner_id = '2389476284936446234';
            }
        }
    ]
});
