import { ChannelIsNsfwSubtag } from '@blargbot/bbtag/subtags/channel/channelisnsfw';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetChannelPropTestCases } from './_getChannelPropTest';

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
                        channel.nsfw = true;
                    }
                },
                {
                    expected: 'false',
                    setup(channel) {
                        channel.nsfw = false;
                    }
                }
            ]
        })
    ]
});
