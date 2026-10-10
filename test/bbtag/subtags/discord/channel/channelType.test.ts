import type { ChannelTypeName, GuildChannelTypeLocals } from '@blargbot/bbtag-engine';
import { ChannelType, replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

await runSubtagTests({
    replacer: replacers.channelTypeReplacer,
    names: ['channelType'],
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetChannelPropTestCases<GuildChannelTypeLocals>({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['channeltype', ...args].join(';')}}`;
            },
            cases: Object.entries({
                GUILD_TEXT: 'text',
                DM: 'dm',
                GUILD_VOICE: 'voice',
                GROUP_DM: 'group-dm',
                GUILD_CATEGORY: 'category',
                GUILD_ANNOUNCEMENT: 'news',
                ANNOUNCEMENT_THREAD: 'news-thread',
                PUBLIC_THREAD: 'public-thread',
                PRIVATE_THREAD: 'private-thread',
                GUILD_STAGE_VOICE: 'stage-voice',
                GUILD_DIRECTORY: 'directory',
                GUILD_FORUM: 'forum',
                GUILD_MEDIA: 'media'
            } satisfies Record<ChannelTypeName, string>).map(([key, expected]) => ({
                title: `Channel is a ${key} (${ChannelType[key]})`,
                expected,
                setup(ctx, channelId) {
                    ctx.discord.setup(m => m.getChannelType(channelId)).resolves(ChannelType[key]).mustHappen(1);
                }
            }))
        })
    ]
});
