import { ChannelIsCategorySubtag } from '@blargbot/bbtag/subtags/channel/channelIsCategory.js';
import * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

await runSubtagTests({
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
                title: `Channel is a ${key} (${eris.Constants.ChannelTypes[key]})`,
                expected: success.toString(),
                setup(channel) {
                    channel.type = eris.Constants.ChannelTypes[key];
                }
            }))

        })
    ]
});
