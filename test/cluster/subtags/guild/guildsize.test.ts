import { GuildSizeSubtag } from '@blargbot/cluster/subtags/guild/guildsize';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new GuildSizeSubtag(),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{guildsize}',
            expected: '123',
            setup(ctx) {
                ctx.guild.member_count = 123;
            }
        }
    ]
});
