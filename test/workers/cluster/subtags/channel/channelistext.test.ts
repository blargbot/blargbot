import { ChannelIsTextSubtag } from '@cluster/subtags/channel/channelistext';
import { Constants } from 'eris';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetChannelPropTestCases } from './_getChannelPropTest';

runSubtagTests({
    subtag: new ChannelIsTextSubtag(),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['channelistext', ...args].join(';')}}`;
            },
            cases: Object.entries({
                ['GUILD_TEXT']: true,
                ['GUILD_VOICE']: false,
                ['GUILD_CATEGORY']: false,
                ['GUILD_NEWS']: true,
                ['GUILD_STORE']: false,
                ['GUILD_NEWS_THREAD']: true,
                ['GUILD_PUBLIC_THREAD']: true,
                ['GUILD_PRIVATE_THREAD']: true,
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
