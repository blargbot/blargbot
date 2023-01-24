import { Subtag } from '@blargbot/bbtag';
import { GuildOwnerIdSubtag } from '@blargbot/bbtag/subtags/guild/guildOwnerId.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(GuildOwnerIdSubtag),
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
