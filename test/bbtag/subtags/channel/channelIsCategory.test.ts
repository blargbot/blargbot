import { ChannelType } from '@blargbot/bbtag';
import type { GetChannelTypeThunk } from '@blargbot/bbtag/subtags';
import { ChannelIsCategorySubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

const getChannelType = new Mock<GetChannelTypeThunk>({ id: 'getChannelType ', callable: true });

await runSubtagTests({
    subtag: new ChannelIsCategorySubtag({
        getChannelType: getChannelType.instance
    }),
    argCountBounds: { min: 1, max: 2 },
    names: ['channelIsCategory', 'isCategory'],
    setup(ctx) {
        ctx.adoptMock(getChannelType);
    },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: '',
            includeNoArgs: false,
            generateCode(...args) {
                return `{${['channeliscategory', ...args].join(';')}}`;
            },
            cases: Object.entries({
                ['GUILD_TEXT']: false,
                ['DM']: false,
                ['GUILD_VOICE']: false,
                ['GROUP_DM']: false,
                ['GUILD_CATEGORY']: true,
                ['GUILD_ANNOUNCEMENT']: false,
                ['ANNOUNCEMENT_THREAD']: false,
                ['PRIVATE_THREAD']: false,
                ['PUBLIC_THREAD']: false,
                ['GUILD_STAGE_VOICE']: false,
                ['GUILD_DIRECTORY']: false,
                ['GUILD_FORUM']: false,
                ['GUILD_MEDIA']: false
            } satisfies Record<keyof typeof ChannelType, boolean>).map(([key, success]) => ({
                title: `Channel is a ${key} (${ChannelType[key]})`,
                expected: success.toString(),
                setup(channelId, ctx) {
                    getChannelType.setup(m => m(ctx.guild.id, channelId)).resolves(ChannelType[key]);
                }
            }))
        })
    ]
});
