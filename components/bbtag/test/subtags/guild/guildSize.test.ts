import { Subtag } from '@blargbot/bbtag';
import { GuildSizeSubtag } from '@blargbot/bbtag/subtags/guild/guildSize.js';
import { snowflake } from '@blargbot/discord-util';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite.js';

const createSnowflake = snowflake.nextFactory();
runSubtagTests({
    subtag: Subtag.getDescriptor(GuildSizeSubtag),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{guildsize}',
            expected: '123',
            postSetup(bbctx, ctx) {
                ctx.userService.setup(m => m.getAll(bbctx))
                    .thenResolve(Array.from({ length: 123 }, () => SubtagTestContext.createMember({ id: createSnowflake() })));
            }
        }
    ]
});
