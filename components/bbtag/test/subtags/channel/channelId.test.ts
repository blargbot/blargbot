import { Subtag } from '@bbtag/blargbot';
import { ChannelIdSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ChannelIdSubtag),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['channelid', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '8237642839674943',
                    setup(channel) {
                        channel.id = '8237642839674943';
                    }
                }
            ]
        })
    ]
});
