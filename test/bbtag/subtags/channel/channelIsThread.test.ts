import { ChannelType } from '@blargbot/bbtag';
import type { GetChannelTypeThunk } from '@blargbot/bbtag/subtags';
import { ChannelIsThreadSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

const getChannelType = new Mock<GetChannelTypeThunk>({ id: 'getChannelType ', callable: true });

await runSubtagTests({
    subtag: new ChannelIsThreadSubtag({
        getChannelType: getChannelType.instance
    }),
    argCountBounds: { min: 0, max: 2 },
    names: ['channelIsThread', 'isThread'],
    setup(ctx) {
        ctx.adoptMock(getChannelType);
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
                    getChannelType.setup(m => m(ctx.guild.id, channelId)).resolves(ChannelType[key]);
                }
            }))
        })
    ]
});
