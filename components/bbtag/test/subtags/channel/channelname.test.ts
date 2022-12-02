import { ChannelNameSubtag } from '@blargbot/bbtag/subtags/channel/channelName.js';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

runSubtagTests({
    subtag: new ChannelNameSubtag(),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['channelname', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'my cool channel',
                    setup(channel) {
                        channel.name = 'my cool channel';
                    }
                }
            ]
        })
    ]
});
