import type { Entities } from '@bbtag/blargbot';
import { Subtag } from '@bbtag/blargbot';
import { ChannelTypeSubtag } from '@bbtag/blargbot/subtags';
import * as Discord from 'discord-api-types/v10';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ChannelTypeSubtag),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['channeltype', ...args].join(';')}}`;
            },
            cases: Object.values<{ [P in Entities.Channel['type']]: { type: P; name: string; success: string; } }>({
                [Discord.ChannelType.GuildText]: { type: Discord.ChannelType.GuildText, name: 'GUILD_TEXT', success: 'text' },
                [Discord.ChannelType.GuildVoice]: { type: Discord.ChannelType.GuildVoice, name: 'GUILD_VOICE', success: 'voice' },
                [Discord.ChannelType.GuildCategory]: { type: Discord.ChannelType.GuildCategory, name: 'GUILD_CATEGORY', success: 'category' },
                [Discord.ChannelType.GuildAnnouncement]: { type: Discord.ChannelType.GuildAnnouncement, name: 'GUILD_NEWS', success: 'news' },
                [Discord.ChannelType.AnnouncementThread]: { type: Discord.ChannelType.AnnouncementThread, name: 'GUILD_NEWS_THREAD', success: 'news-thread' },
                [Discord.ChannelType.PublicThread]: { type: Discord.ChannelType.PublicThread, name: 'GUILD_PUBLIC_THREAD', success: 'public-thread' },
                [Discord.ChannelType.PrivateThread]: { type: Discord.ChannelType.PrivateThread, name: 'GUILD_PRIVATE_THREAD', success: 'private-thread' },
                [Discord.ChannelType.GuildStageVoice]: { type: Discord.ChannelType.GuildStageVoice, name: 'GUILD_STAGE_VOICE', success: 'stage-voice' },
                [Discord.ChannelType.GuildForum]: { type: Discord.ChannelType.GuildForum, name: 'GUILD_FORUM', success: 'forum' }
            }).map(({ type, name, success }) => ({
                title: `Channel is a ${name} (${type})`,
                expected: success.toString(),
                setup(channel) {
                    channel.type = type;
                }
            }))
        })
    ]
});
