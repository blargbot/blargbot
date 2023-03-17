import { GuildSizeSubtag } from '@bbtag/blargbot/subtags';
import { snowflake } from '@blargbot/discord-util';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite.js';

const createSnowflake = snowflake.nextFactory();
runSubtagTests({
    subtag: GuildSizeSubtag,
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{guildsize}',
            expected: '123',
            postSetup(bbctx, ctx) {
                ctx.inject.users.setup(m => m.getAll(bbctx.runtime))
                    .thenResolve(Array.from({ length: 123 }, () => SubtagTestContext.createMember({ id: createSnowflake() })));
            }
        }
    ]
});
