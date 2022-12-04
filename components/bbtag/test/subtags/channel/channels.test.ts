import { ChannelsSubtag } from '@blargbot/bbtag/subtags/channel/channels.js';
import Discord from 'discord-api-types/v9';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

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
                        channel.type = Discord.ChannelType.GuildCategory;

                        ctx.channels.abc = SubtagTestContext.createApiChannel({
                            id: '2398462398472',
                            type: Discord.ChannelType.GuildText,
                            parent_id: channel.id
                        });
                        ctx.channels.def = SubtagTestContext.createApiChannel({
                            id: '23098475928447',
                            type: Discord.ChannelType.GuildText,
                            parent_id: channel.id
                        });
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
