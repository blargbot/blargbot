import { ChannelType } from '@blargbot/bbtag';
import type { GetChannelTypeThunk } from '@blargbot/bbtag/subtags';
import { ChannelIsTextSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

const getChannelType = new Mock<GetChannelTypeThunk>({ id: 'getChannelType ', callable: true });

await runSubtagTests({
    subtag: new ChannelIsTextSubtag({
        getChannelType: getChannelType.instance
    }),
    argCountBounds: { min: 0, max: 2 },
    names: ['channelIsText', 'isText'],
    setup(ctx) {
        ctx.adoptMock(getChannelType);
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
                    getChannelType.setup(m => m(ctx.guild.id, channelId)).resolves(ChannelType[key]);
                }
            }))
        })
    ]
});
