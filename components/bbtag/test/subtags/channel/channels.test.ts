import { Subtag } from '@blargbot/bbtag';
import { ChannelsSubtag } from '@blargbot/bbtag/subtags';
import Discord from 'discord-api-types/v10';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ChannelsSubtag),
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

                        ctx.channels.abc = SubtagTestContext.createChannel({
                            id: '2398462398472',
                            type: Discord.ChannelType.GuildText,
                            parent_id: channel.id
                        });
                        ctx.channels.def = SubtagTestContext.createChannel({
                            id: '23098475928447',
                            type: Discord.ChannelType.GuildText,
                            parent_id: channel.id
                        });
                    },
                    postSetup(_, bbctx, ctx) {
                        ctx.channelService.setup(m => m.getAll(bbctx)).thenResolve(Object.values(ctx.channels));
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
            },
            postSetup(bbctx, ctx) {
                ctx.channelService.setup(m => m.getAll(bbctx)).thenResolve(Object.values(ctx.channels));
            }
        }
    ]
});