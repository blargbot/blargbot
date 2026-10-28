import { BBTagRuntimeError, ChannelNotFoundError } from '@blargbot/bbtag';
import type { GetChannelPositionFeature } from '@blargbot/bbtag/subtags';
import { ChannelPositionSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

const features = new Mock<GetChannelPositionFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new ChannelPositionSubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['channelPosition', 'channelPos', 'categoryPos', 'categoryPosition'],
    setup(ctx) {
        ctx.adoptMock(features);
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
                        features.setup(m => m.getChannelPosition(ctx.guildId, channelId)).resolves(324).mustHappen(1);;
                    }
                },
                {
                    expected: '`Threads dont have a position`',
                    channelId: '23948762874624372942',
                    error: new BBTagRuntimeError('Threads dont have a position', '<#23948762874624372942> is a thread and doesnt have a position'),
                    setup(channelId, ctx) {
                        features.setup(m => m.getChannelPosition(ctx.guildId, channelId)).resolves('thread').mustHappen(1);;
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
                ctx.channelId = '23948762874624372942';
                features.setup(m => m.getChannelPosition(ctx.guildId, '23948762874624372942')).resolves(undefined).mustHappen(1);
            }
        }
    ]
});
