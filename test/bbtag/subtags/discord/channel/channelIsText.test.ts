import type { ChannelTypeName, GuildChannelTypeLocals } from '@blargbot/bbtag-engine';
import { ChannelType, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

await runSubtagTests({
    replacer: replacers.channelIsTextReplacer,
    names: ['channelIsText', 'isText'],
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetChannelPropTestCases<GuildChannelTypeLocals>({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['channelistext', ...args].join(';')}}`;
            },
            cases: Object.entries({
                GUILD_TEXT: true,
                DM: true,
                GUILD_VOICE: true,
                GROUP_DM: true,
                GUILD_CATEGORY: false,
                GUILD_ANNOUNCEMENT: true,
                ANNOUNCEMENT_THREAD: true,
                PUBLIC_THREAD: true,
                PRIVATE_THREAD: true,
                GUILD_STAGE_VOICE: true,
                GUILD_DIRECTORY: false,
                GUILD_FORUM: false,
                GUILD_MEDIA: false
            } satisfies Record<ChannelTypeName, boolean>).map(([key, success]) => ({
                title: `Channel is a ${key} (${ChannelType[key]})`,
                expected: success.toString(),
                setup(ctx, channelId) {
                    ctx.discord.setup(m => m.getChannelType(channelId)).resolves(ChannelType[key]).mustHappen(1);
                }
            }))
        })
    ]
});
