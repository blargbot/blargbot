import type { ChannelTypeName, GuildChannelTypeLocals } from '@blargbot/bbtag-engine';
import { ChannelType, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

await runSubtagTests({
    replacer: replacers.channelIsThreadReplacer,
    names: ['channelIsThread', 'isThread'],
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetChannelPropTestCases<GuildChannelTypeLocals>({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['channelisthread', ...args].join(';')}}`;
            },
            cases: Object.entries({
                GUILD_TEXT: false,
                DM: false,
                GUILD_VOICE: false,
                GROUP_DM: false,
                GUILD_CATEGORY: false,
                GUILD_ANNOUNCEMENT: false,
                ANNOUNCEMENT_THREAD: true,
                PUBLIC_THREAD: true,
                PRIVATE_THREAD: true,
                GUILD_STAGE_VOICE: false,
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
