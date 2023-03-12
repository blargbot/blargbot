import { BBTagRuntimeError, Subtag } from '@bbtag/blargbot';
import { ChannelCategorySubtag } from '@bbtag/blargbot/subtags';
import type Discord from '@blargbot/discord-types';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ChannelCategorySubtag),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['channelcategory', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '8237642839674943',
                    setup(channel) {
                        (channel as Discord.APITextChannel).parent_id = '8237642839674943';
                    }
                }
            ]
        }),
        {
            code: '{channelcategory}',
            expected: '',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Channel has no parent').withDisplay('') }
            ]
        }
    ]
});
