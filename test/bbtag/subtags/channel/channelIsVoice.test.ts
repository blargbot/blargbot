import { ChannelIsVoiceSubtag } from '@blargbot/bbtag/subtags/channel/channelIsVoice.js';
import * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

await runSubtagTests({
    subtag: new ChannelIsVoiceSubtag(),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['channelisvoice', ...args].join(';')}}`;
            },
            cases: Object.entries({
                ['GUILD_TEXT']: false,
                ['GUILD_VOICE']: true,
                ['GUILD_CATEGORY']: false,
                ['GUILD_NEWS']: false,
                ['GUILD_NEWS_THREAD']: false,
                ['GUILD_PUBLIC_THREAD']: false,
                ['GUILD_PRIVATE_THREAD']: false,
                ['GUILD_STAGE_VOICE']: true
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
