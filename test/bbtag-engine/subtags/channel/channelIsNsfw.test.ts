import { replacers } from '@blargbot/bbtag-engine';
import type { APITextChannel } from 'discord-api-types/v9';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

await runSubtagTests({
    replacer: replacers.channelIsNsfwReplacer,
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
                        (channel as APITextChannel).nsfw = true;
                    }
                },
                {
                    expected: 'false',
                    setup(channel) {
                        (channel as APITextChannel).nsfw = false;
                    }
                }
            ]
        })
    ]
});
