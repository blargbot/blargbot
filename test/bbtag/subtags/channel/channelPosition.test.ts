import { BBTagRuntimeError, ChannelNotFoundError } from '@blargbot/bbtag';
import type { GetChannelPositionThunk } from '@blargbot/bbtag/subtags';
import { ChannelPositionSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

const getChannelPosition = new Mock<GetChannelPositionThunk>({ id: 'getChannelPosition', callable: true });

await runSubtagTests({
    subtag: new ChannelPositionSubtag({
        getChannelPosition: getChannelPosition.instance
    }),
    argCountBounds: { min: 0, max: 2 },
    names: ['channelPosition', 'channelPos', 'categoryPos', 'categoryPosition'],
    setup(ctx) {
        ctx.adoptMock(getChannelPosition);
    },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: '',
            includeNoArgs: true,
            generateCode(...args) {
                return `{${['channelpos', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '324',
                    setup(channelId, ctx) {
                        getChannelPosition.setup(m => m(ctx.guild.id, channelId)).resolves(324).mustHappen(1);;
                    }
                },
                {
                    expected: '`Threads dont have a position`',
                    channelId: '23948762874624372942',
                    error: new BBTagRuntimeError('Threads dont have a position', '<#23948762874624372942> is a thread and doesnt have a position'),
                    setup(channelId, ctx) {
                        getChannelPosition.setup(m => m(ctx.guild.id, channelId)).resolves('thread').mustHappen(1);;
                    }
                }
            ]
        }),
        {
            code: '{channelpos}',
            expected: '`No channel found`',
            errors: [
                { error: new ChannelNotFoundError('23948762874624372942') }
            ],
            setup(ctx) {
                ctx.channels.command.id = '23948762874624372942';
                ctx.message.channel_id = ctx.channels.command.id;
                getChannelPosition.setup(m => m(ctx.guild.id, '23948762874624372942')).resolves(undefined).mustHappen(1);
            }
        }
    ]
});
