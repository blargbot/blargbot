import { ChannelIsNsfwSubtag } from '@blargbot/bbtag/subtags/channel/channelIsNsfw.js';
import Discord from 'discord-api-types/v9';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

runSubtagTests({
    subtag: new ChannelIsNsfwSubtag(),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['channelisnsfw', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'true',
                    setup(channel) {
                        (channel as Discord.APITextChannel).nsfw = true;
                    }
                },
                {
                    expected: 'false',
                    setup(channel) {
                        (channel as Discord.APITextChannel).nsfw = false;
                    }
                }
            ]
        })
    ]
});
