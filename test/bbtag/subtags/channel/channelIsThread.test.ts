import { ChannelType } from '@blargbot/bbtag-engine';
import type { GetChannelTypeFeature } from '@blargbot/bbtag-engine/subtags';
import { ChannelIsThreadSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

const features = new Mock<GetChannelTypeFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new ChannelIsThreadSubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['channelIsThread', 'isThread'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['channelisthread', ...args].join(';')}}`;
            },
            cases: Object.entries({
                ['GUILD_TEXT']: false,
                ['DM']: false,
                ['GUILD_VOICE']: false,
                ['GROUP_DM']: false,
                ['GUILD_CATEGORY']: false,
                ['GUILD_ANNOUNCEMENT']: false,
                ['ANNOUNCEMENT_THREAD']: true,
                ['PRIVATE_THREAD']: true,
                ['PUBLIC_THREAD']: true,
                ['GUILD_STAGE_VOICE']: false,
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
