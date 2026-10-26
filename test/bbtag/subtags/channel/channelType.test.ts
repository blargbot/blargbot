import { ChannelType } from '@blargbot/bbtag';
import type { GetChannelTypeFeature } from '@blargbot/bbtag/subtags';
import { ChannelTypeSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

const features = new Mock<GetChannelTypeFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new ChannelTypeSubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['channelType'],
    setup(ctx) {
        ctx.adoptMock(features);
    },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['channeltype', ...args].join(';')}}`;
            },
            cases: Object.entries({
                ['GUILD_TEXT']: 'text',
                ['DM']: 'dm',
                ['GUILD_VOICE']: 'voice',
                ['GROUP_DM']: 'group-dm',
                ['GUILD_CATEGORY']: 'category',
                ['GUILD_ANNOUNCEMENT']: 'news',
                ['ANNOUNCEMENT_THREAD']: 'news-thread',
                ['PRIVATE_THREAD']: 'private-thread',
                ['PUBLIC_THREAD']: 'public-thread',
                ['GUILD_STAGE_VOICE']: 'stage-voice',
                ['GUILD_DIRECTORY']: 'directory',
                ['GUILD_FORUM']: 'forum',
                ['GUILD_MEDIA']: 'media'
            } satisfies Record<keyof typeof ChannelType, string>).map(([key, success]) => ({
                title: `Channel is a ${key} (${ChannelType[key]})`,
                expected: success,
                setup(channelId, ctx) {
                    features.setup(m => m.getChannelType(ctx.guild.id, channelId)).resolves(ChannelType[key]);
                }
            }))

        })
    ]
});
