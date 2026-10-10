import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

await runSubtagTests({
    replacer: replacers.channelIdReplacer,
    names: ['channelId'],
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
                    expected: '<a channel id>',
                    setup(_, channelId) {
                        this.expected = channelId.toString();
                    }
                }
            ]
        })
    ]
});
