import { ChannelType } from '@blargbot/bbtag';
import type { GetChannelTypeFeature } from '@blargbot/bbtag/subtags';
import { ChannelIsVoiceSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

const features = new Mock<GetChannelTypeFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new ChannelIsVoiceSubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['channelIsVoice', 'isVoice'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['channelisvoice', ...args].join(';')}}`;
            },
            cases: Object.entries({
                ['GUILD_TEXT']: false,
                ['DM']: false,
                ['GUILD_VOICE']: true,
                ['GROUP_DM']: false,
                ['GUILD_CATEGORY']: false,
                ['GUILD_ANNOUNCEMENT']: false,
                ['ANNOUNCEMENT_THREAD']: false,
                ['PRIVATE_THREAD']: false,
                ['PUBLIC_THREAD']: false,
                ['GUILD_STAGE_VOICE']: true,
                ['GUILD_DIRECTORY']: false,
                ['GUILD_FORUM']: false,
                ['GUILD_MEDIA']: false
            } satisfies Record<keyof typeof ChannelType, boolean>).map(([key, success]) => ({
                title: `Channel is a ${key} (${ChannelType[key]})`,
                expected: success.toString(),
                setup(channelId, ctx) {
                    features.setup(m => m.getChannelType(ctx.guild.id, channelId)).resolves(ChannelType[key]);
                }
            }))
        })
    ]
});
