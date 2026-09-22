import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

await runSubtagTests({
    replacer: replacers.channelIdReplacer,
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
