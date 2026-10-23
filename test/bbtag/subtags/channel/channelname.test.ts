import type { GetChannelNameThunk } from '@blargbot/bbtag/subtags';
import { ChannelNameSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

const getChannelName = new Mock<GetChannelNameThunk>({ id: 'getChannelName', callable: true });

await runSubtagTests({
    subtag: new ChannelNameSubtag({
        getChannelName: getChannelName.instance
    }),
    argCountBounds: { min: 0, max: 2 },
    names: ['channelName', 'categoryName'],
    setup(ctx) {
        ctx.adoptMock(getChannelName);
    },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['channelname', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'my cool channel',
                    setup(channelId, ctx) {
                        getChannelName.setup(m => m(ctx.guild.id, channelId)).resolves('my cool channel').mustHappen(1);
                    }
                },
                {
                    expected: 'unknown',
                    setup(channelId, ctx) {
                        getChannelName.setup(m => m(ctx.guild.id, channelId)).resolves(undefined).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
