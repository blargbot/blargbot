import { Subtag } from '@blargbot/bbtag';
import { ChannelIsThreadSubtag } from '@blargbot/bbtag/subtags/channel/channelIsThread.js';
import * as Eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ChannelIsThreadSubtag),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['channelisthread', ...args].join(';')}}`;
            },
            cases: Object.entries({
                ['GUILD_TEXT']: false,
                ['GUILD_VOICE']: false,
                ['GUILD_CATEGORY']: false,
                ['GUILD_NEWS']: false,
                ['GUILD_STORE']: false,
                ['GUILD_NEWS_THREAD']: true,
                ['GUILD_PUBLIC_THREAD']: true,
                ['GUILD_PRIVATE_THREAD']: true,
                ['GUILD_STAGE_VOICE']: false
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
