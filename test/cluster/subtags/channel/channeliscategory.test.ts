import { ChannelIsCategorySubtag } from '@blargbot/cluster/subtags/channel/channeliscategory';
import { Constants } from 'eris';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetChannelPropTestCases } from './_getChannelPropTest';

runSubtagTests({
    subtag: new ChannelIsCategorySubtag(),
    argCountBounds: { min: 1, max: 2 },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: '',
            includeNoArgs: false,
            generateCode(...args) {
                return `{${['channeliscategory', ...args].join(';')}}`;
            },
            cases: Object.entries({
                ['GUILD_TEXT']: false,
                ['GUILD_VOICE']: false,
                ['GUILD_CATEGORY']: true,
                ['GUILD_NEWS']: false,
                ['GUILD_STORE']: false,
                ['GUILD_NEWS_THREAD']: false,
                ['GUILD_PUBLIC_THREAD']: false,
                ['GUILD_PRIVATE_THREAD']: false,
                ['GUILD_STAGE_VOICE']: false
            }).map(([key, success]) => ({
                title: `Channel is a ${key} (${Constants.ChannelTypes[key]})`,
                expected: success.toString(),
                setup(channel) {
                    channel.type = Constants.ChannelTypes[key];
                }
            }))

        })
    ]
});
