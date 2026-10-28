import { ChannelType } from '@blargbot/bbtag';
import type { GetChannelTypeFeature } from '@blargbot/bbtag/subtags';
import { ChannelIsTextSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

const features = new Mock<GetChannelTypeFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new ChannelIsTextSubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['channelIsText', 'isText'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['channelistext', ...args].join(';')}}`;
            },
            cases: Object.entries({
                ['GUILD_TEXT']: true,
                ['DM']: true,
                ['GUILD_VOICE']: true,
                ['GROUP_DM']: true,
                ['GUILD_CATEGORY']: false,
                ['GUILD_ANNOUNCEMENT']: true,
                ['ANNOUNCEMENT_THREAD']: true,
                ['PRIVATE_THREAD']: true,
                ['PUBLIC_THREAD']: true,
                ['GUILD_STAGE_VOICE']: true,
                ['GUILD_DIRECTORY']: false,
                ['GUILD_FORUM']: false,
                ['GUILD_MEDIA']: false
            } satisfies Record<keyof typeof ChannelType, boolean>).map(([key, success]) => ({
                title: `Channel is a ${key} (${ChannelType[key]})`,
                expected: success.toString(),
                setup(channelId, ctx) {
                    features.setup(m => m.getChannelType(ctx.guildId, channelId)).resolves(ChannelType[key]);
                }
            }))
        })
    ]
});
