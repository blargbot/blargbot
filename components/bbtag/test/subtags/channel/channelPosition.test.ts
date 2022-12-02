import { BBTagRuntimeError } from '@blargbot/bbtag/errors/index.js';
import { ChannelPositionSubtag } from '@blargbot/bbtag/subtags/channel/channelPosition.js';
import { APITextChannel } from 'discord-api-types/v9';
import * as Eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

runSubtagTests({
    subtag: new ChannelPositionSubtag(),
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
                        (channel as APITextChannel).position = 324;
                    }
                }
            ]
        }),
        {
            code: '{channelpos}',
            expected: '`Threads dont have a position`',
            errors: [
                { start: 0, end: 12, error: new BBTagRuntimeError('Threads dont have a position', '<#23948762874624372942> is a thread and doesnt have a position') }
            ],
            setup(ctx) {
                ctx.channels.command.id = '23948762874624372942';
                ctx.message.channel_id = ctx.channels.command.id;
                ctx.channels.command.type = Eris.Constants.ChannelTypes.GUILD_PUBLIC_THREAD;
            }
        }
    ]
});
