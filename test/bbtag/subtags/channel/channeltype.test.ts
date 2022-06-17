import { ChannelTypeSubtag } from '@blargbot/bbtag/subtags/channel/channeltype';
import { Constants } from 'eris';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetChannelPropTestCases } from './_getChannelPropTest';

runSubtagTests({
    subtag: new ChannelTypeSubtag(),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['channeltype', ...args].join(';')}}`;
            },
            cases: Object.entries({
                ['GUILD_TEXT']: 'text',
                ['GUILD_VOICE']: 'voice',
                ['GUILD_CATEGORY']: 'category',
                ['GUILD_NEWS']: 'news',
                ['GUILD_STORE']: 'store',
                ['GUILD_NEWS_THREAD']: 'news-thread',
                ['GUILD_PUBLIC_THREAD']: 'public-thread',
                ['GUILD_PRIVATE_THREAD']: 'private-thread',
                ['GUILD_STAGE_VOICE']: 'stage-voice'
            }).map(([key, success]) => ({
                title: `Channel is a ${key} (${Constants.ChannelTypes[key]})`,
                expected: success,
                setup(channel) {
                    channel.type = Constants.ChannelTypes[key];
                }
            }))

        })
    ]
});
