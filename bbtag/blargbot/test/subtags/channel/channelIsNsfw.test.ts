import { ChannelIsNsfwSubtag } from '@bbtag/blargbot/subtags';
import type Discord from '@blargbot/discord-types';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

runSubtagTests({
    subtag: ChannelIsNsfwSubtag,
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
