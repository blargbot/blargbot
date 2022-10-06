import { BBTagRuntimeError } from '@blargbot/bbtag/errors';
import { ChannelCategorySubtag } from '@blargbot/bbtag/subtags/channel/channelcategory';
import { APITextChannel } from 'discord-api-types/v9';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetChannelPropTestCases } from './_getChannelPropTest';

runSubtagTests({
    subtag: new ChannelCategorySubtag(),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: ``,
            includeNoArgs: true,
            generateCode(...args) {
                return `{${[`channelcategory`, ...args].join(`;`)}}`;
            },
            cases: [
                {
                    expected: `8237642839674943`,
                    setup(channel) {
                        (channel as APITextChannel).parent_id = `8237642839674943`;
                    }
                }
            ]
        }),
        {
            code: `{channelcategory}`,
            expected: ``,
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError(`Channel has no parent`).withDisplay(``) }
            ]
        }
    ]
});
