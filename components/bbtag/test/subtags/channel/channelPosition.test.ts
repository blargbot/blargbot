import { BBTagRuntimeError, Subtag } from '@blargbot/bbtag';
import { ChannelPositionSubtag } from '@blargbot/bbtag/subtags';
import Discord from 'discord-api-types/v10';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ChannelPositionSubtag),
    argCountBounds: { min: 0, max: 2 },
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
                    setup(channel) {
                        (channel as Discord.APITextChannel).position = 324;
                    }
                }
            ]
        }),
        {
            code: '{channelpos}',
            expected: '`Threads dont have a position`',
            errors: [
                { start: 0, end: 12, error: new BBTagRuntimeError('Threads dont have a position', '<#239487628724372942> is a thread and doesnt have a position') }
            ],
            setup(ctx) {
                ctx.channels.command.id = '239487628724372942';
                ctx.message.channel_id = ctx.channels.command.id;
                ctx.channels.command.type = Discord.ChannelType.PublicThread;
            }
        }
    ]
});
