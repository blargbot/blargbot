import type { ListChannelsThunk } from '@blargbot/bbtag/subtags';
import { ChannelsSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

const listChannels = new Mock<ListChannelsThunk>({ id: 'listChannels', callable: true });

await runSubtagTests({
    subtag: new ChannelsSubtag({
        listChannels: listChannels.instance
    }),
    argCountBounds: { min: 0, max: 2 },
    names: ['channels'],
    setup(ctx) {
        ctx.adoptMock(listChannels);
    },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: '',
            includeNoArgs: false,
            generateCode(...args) {
                return `{${['channels', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '[]',
                    setup(channelId, ctx) {
                        listChannels.setup(m => m(ctx.guild.id, channelId)).resolves([]).mustHappen(1);
                    }
                },
                {
                    expected: '["2398462398472","23098475928447"]',
                    setup(channelId, ctx) {
                        listChannels.setup(m => m(ctx.guild.id, channelId)).resolves(['2398462398472', '23098475928447']).mustHappen(1);
                    }
                }
            ]
        }),
        {
            code: '{channels}',
            expected: '["23489762384769837","342789565384956435"]',
            setup(ctx) {
                listChannels.setup(m => m(ctx.guild.id)).resolves(['23489762384769837', '342789565384956435']).mustHappen(1);
            }
        }
    ]
});
