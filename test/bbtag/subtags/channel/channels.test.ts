import { ChannelsSubtag } from '@blargbot/bbtag/subtags/channel/channels';
import { ChannelType } from 'discord-api-types';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite';
import { createGetChannelPropTestCases } from './_getChannelPropTest';

runSubtagTests({
    subtag: new ChannelsSubtag(),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: '',
            includeNoArgs: false,
            generateCode(...args) {
                return `{${['channels', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '["2398462398472","23098475928447"]',
                    setup(channel, ctx) {
                        channel.type = ChannelType.GuildCategory;

                        ctx.guild.channels.push(
                            SubtagTestContext.createApiChannel({
                                id: '2398462398472',
                                type: ChannelType.GuildText,
                                parent_id: channel.id
                            }),
                            SubtagTestContext.createApiChannel({
                                id: '23098475928447',
                                type: ChannelType.GuildText,
                                parent_id: channel.id
                            })
                        );
                    }
                }
            ]
        }),
        {
            code: '{channels}',
            expected: '["23489762384769837","342789565384956435"]',
            setup(ctx) {
                ctx.channels.command.id = '23489762384769837';
                ctx.channels.general.id = '342789565384956435';
                ctx.message.channel_id = ctx.channels.command.id;
            }
        }
    ]
});
