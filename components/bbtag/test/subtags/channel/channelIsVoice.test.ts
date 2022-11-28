import { ChannelIsVoiceSubtag } from '@blargbot/bbtag/subtags/channel/channelIsVoice';
import Eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetChannelPropTestCases } from './_getChannelPropTest';

runSubtagTests({
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
                ['GUILD_STORE']: false,
                ['GUILD_NEWS_THREAD']: false,
                ['GUILD_PUBLIC_THREAD']: false,
                ['GUILD_PRIVATE_THREAD']: false,
                ['GUILD_STAGE_VOICE']: true
            }).map(([key, success]) => ({
                title: `Channel is a ${key} (${Eris.Constants.ChannelTypes[key]})`,
                expected: success.toString(),
                setup(channel) {
                    channel.type = Eris.Constants.ChannelTypes[key];
                }
            }))

        })
    ]
});
