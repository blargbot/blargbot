import { BBTagRuntimeError } from '@blargbot/bbtag/errors/index.js';
import { ChannelCreateSubtag } from '@blargbot/bbtag/subtags/channel/channelCreate.js';
import { EscapeBBTagSubtag } from '@blargbot/bbtag/subtags/misc/escapeBBTag.js';
import { argument } from '@blargbot/test-util/mock.js';
import Discord from 'discord-api-types/v9';
import * as Eris from 'eris';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: new ChannelCreateSubtag(),
    argCountBounds: { min: 1, max: 3 },
    setupEach(ctx) {
        ctx.roles.authorizer.permissions = Eris.Constants.Permissions.administrator.toString();
    },
    cases: [
        {
            code: '{channelcreate;My new channel}',
            expected: '28376128632132',
            setup(ctx) {
                const channel = ctx.createMock(Eris.TextChannel);
                channel.setup(m => m.id).thenReturn('28376128632132');

                ctx.discord.setup(m => m.createChannel(ctx.guild.id, 'My new channel', Discord.ChannelType.GuildText, argument.isDeepEqual({
                    bitrate: undefined,
                    nsfw: undefined,
                    parentID: undefined,
                    rateLimitPerUser: undefined,
                    topic: undefined,
                    userLimit: undefined,
                    permissionOverwrites: undefined,
                    reason: 'Command User#0000'
                }), undefined)).thenResolve(channel.instance);
            }
        },
        ...[
            { type: 'text', instance: Eris.TextChannel, code: Discord.ChannelType.GuildText },
            { type: 'voice', instance: Eris.VoiceChannel, code: Discord.ChannelType.GuildVoice },
            { type: 'category', instance: Eris.CategoryChannel, code: Discord.ChannelType.GuildCategory },
            { type: 'news', instance: Eris.NewsChannel, code: Discord.ChannelType.GuildAnnouncement },
            { type: 'this is some garbage', instance: Eris.TextChannel, code: Discord.ChannelType.GuildText },
            { type: '', instance: Eris.TextChannel, code: Discord.ChannelType.GuildText }
        ].flatMap(({ type, instance, code }) => [
            {
                code: `{channelcreate;My new channel;${type}}`,
                expected: '28376128632132',
                setup(ctx: SubtagTestContext) {
                    const channel = ctx.createMock<Eris.Channel>(instance);
                    channel.setup(m => m.id).thenReturn('28376128632132');

                    ctx.discord.setup(m => m.createChannel(ctx.guild.id, 'My new channel', code, argument.isDeepEqual({
                        bitrate: undefined,
                        nsfw: undefined,
                        parentID: undefined,
                        rateLimitPerUser: undefined,
                        topic: undefined,
                        userLimit: undefined,
                        permissionOverwrites: undefined,
                        reason: 'Command User#0000'
                    }), undefined)).thenResolve(channel.instance);
                }
            },
            {
                code: `{channelcreate;My new channel;${type};{escapebbtag;{}}}`,
                expected: '28376128632132',
                subtags: [new EscapeBBTagSubtag()],
                setup(ctx: SubtagTestContext) {
                    const channel = ctx.createMock<Eris.Channel>(instance);
                    channel.setup(m => m.id).thenReturn('28376128632132');

                    ctx.discord.setup(m => m.createChannel(ctx.guild.id, 'My new channel', code, argument.isDeepEqual({
                        bitrate: undefined,
                        nsfw: undefined,
                        parentID: undefined,
                        rateLimitPerUser: undefined,
                        topic: undefined,
                        userLimit: undefined,
                        permissionOverwrites: undefined,
                        reason: 'Command User#0000'
                    }), undefined)).thenResolve(channel.instance);
                }
            },
            {
                code: `{channelcreate;My new channel;${type};{escapebbtag;${JSON.stringify({
                    bitrate: 1234,
                    nsfw: true,
                    parentID: '23987233279389273',
                    permissionOverwrites: [
                        {
                            id: '329478923748223',
                            allow: '3827468274',
                            deny: '42937843478',
                            type: 'role'
                        },
                        {
                            id: '9054786496875634',
                            allow: '23432424',
                            deny: '432434234',
                            type: 'member'
                        }
                    ],
                    rateLimitPerUser: 231432,
                    topic: 'xyz123',
                    reason: 'abcdef',
                    userLimit: 32042430
                })}}}`,
                expected: '28376128632132',
                subtags: [new EscapeBBTagSubtag()],
                setup(ctx: SubtagTestContext) {
                    const channel = ctx.createMock<Eris.Channel>(instance);
                    channel.setup(m => m.id).thenReturn('28376128632132');

                    ctx.discord.setup(m => m.createChannel(ctx.guild.id, 'My new channel', code, argument.isDeepEqual({
                        bitrate: 1234,
                        nsfw: true,
                        parentID: '23987233279389273',
                        permissionOverwrites: [
                            {
                                id: '329478923748223',
                                allow: 3827468274n,
                                deny: 42937843478n,
                                type: Discord.OverwriteType.Role
                            },
                            {
                                id: '9054786496875634',
                                allow: 23432424n,
                                deny: 432434234n,
                                type: Discord.OverwriteType.Member
                            }
                        ],
                        rateLimitPerUser: 231432,
                        topic: 'xyz123',
                        reason: 'abcdef',
                        userLimit: 32042430
                    }), undefined)).thenResolve(channel.instance);
                }
            },
            {
                code: `{channelcreate;My new channel;${type};{escapebbtag;${JSON.stringify({
                    bitrate: '1234',
                    nsfw: 'true',
                    parentID: '23987233279389273',
                    permissionOverwrites: [
                        {
                            id: '329478923748223',
                            allow: '3827468274',
                            deny: '42937843478',
                            type: 'role'
                        },
                        {
                            id: '9054786496875634',
                            allow: '23432424',
                            deny: '432434234',
                            type: 'member'
                        }
                    ],
                    rateLimitPerUser: '231432',
                    topic: 'xyz123',
                    reason: 'abcdef',
                    userLimit: '32042430'
                })}}}`,
                expected: '28376128632132',
                subtags: [new EscapeBBTagSubtag()],
                setup(ctx: SubtagTestContext) {
                    const channel = ctx.createMock<Eris.Channel>(instance);
                    channel.setup(m => m.id).thenReturn('28376128632132');

                    ctx.discord.setup(m => m.createChannel(ctx.guild.id, 'My new channel', code, argument.isDeepEqual({
                        bitrate: 1234,
                        nsfw: true,
                        parentID: '23987233279389273',
                        permissionOverwrites: [
                            {
                                id: '329478923748223',
                                allow: 3827468274n,
                                deny: 42937843478n,
                                type: Discord.OverwriteType.Role
                            },
                            {
                                id: '9054786496875634',
                                allow: 23432424n,
                                deny: 432434234n,
                                type: Discord.OverwriteType.Member
                            }
                        ],
                        rateLimitPerUser: 231432,
                        topic: 'xyz123',
                        reason: 'abcdef',
                        userLimit: 32042430
                    }), undefined)).thenResolve(channel.instance);
                }
            }
        ]),
        {
            code: `{channelcreate;My new channel;;{escapebbtag;${JSON.stringify({
                permissionOverwrites: [
                    {
                        id: '329478923748223',
                        type: 'role'
                    }
                ]
            })}}}`,
            expected: '28376128632132',
            subtags: [new EscapeBBTagSubtag()],
            setup(ctx: SubtagTestContext) {
                const channel = ctx.createMock(Eris.TextChannel);
                channel.setup(m => m.id).thenReturn('28376128632132');

                ctx.discord.setup(m => m.createChannel(ctx.guild.id, 'My new channel', Discord.ChannelType.GuildText, argument.isDeepEqual({
                    bitrate: undefined,
                    nsfw: undefined,
                    parentID: undefined,
                    permissionOverwrites: [
                        {
                            id: '329478923748223',
                            allow: 0n,
                            deny: 0n,
                            type: Discord.OverwriteType.Role
                        }
                    ],
                    rateLimitPerUser: undefined,
                    topic: undefined,
                    reason: 'Command User#0000',
                    userLimit: undefined
                }), undefined)).thenResolve(channel.instance);
            }
        },
        {
            code: `{channelcreate;My new channel;;{escapebbtag;${JSON.stringify({
                permissionOverwrites: [
                    {
                        id: '329478923748223',
                        allow: '13',
                        type: 'role'
                    }
                ]
            })}}}`,
            expected: '`Author missing requested permissions`',
            subtags: [new EscapeBBTagSubtag()],
            errors: [
                { start: 0, end: 124, error: new BBTagRuntimeError('Author missing requested permissions') }
            ],
            setup(ctx: SubtagTestContext) {
                ctx.roles.authorizer.permissions = Eris.Constants.Permissions.manageChannels.toString();
            }
        },
        {
            code: '{channelcreate;My new channel!}',
            expected: '`Author cannot create channels`',
            errors: [
                { start: 0, end: 31, error: new BBTagRuntimeError('Author cannot create channels') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = '0';
            }
        },
        {
            code: '{channelcreate;My new channel!;;This isnt valid json!}',
            expected: '`Invalid JSON`',
            errors: [
                { start: 0, end: 54, error: new BBTagRuntimeError('Invalid JSON') }
            ]
        },
        {
            code: '{channelcreate;My new channel}',
            expected: '28376128632132',
            setup(ctx) {
                const channel = ctx.createMock(Eris.TextChannel);
                channel.setup(m => m.id).thenReturn('28376128632132');

                ctx.discord.setup(m => m.createChannel(ctx.guild.id, 'My new channel', Discord.ChannelType.GuildText, argument.isDeepEqual({
                    bitrate: undefined,
                    nsfw: undefined,
                    parentID: undefined,
                    rateLimitPerUser: undefined,
                    topic: undefined,
                    userLimit: undefined,
                    permissionOverwrites: undefined,
                    reason: 'Command User#0000'
                }), undefined)).thenResolve(channel.instance);
            }
        },
        {
            code: '{channelcreate;My new channel}',
            expected: '`Failed to create channel: no perms`',
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Failed to create channel: no perms', 'Test REST error') }
            ],
            setup(ctx) {
                const err = ctx.createRESTError(Eris.ApiError.MISSING_PERMISSIONS);
                ctx.discord.setup(m => m.createChannel(ctx.guild.id, 'My new channel', Discord.ChannelType.GuildText, argument.isDeepEqual({
                    bitrate: undefined,
                    nsfw: undefined,
                    parentID: undefined,
                    rateLimitPerUser: undefined,
                    topic: undefined,
                    userLimit: undefined,
                    permissionOverwrites: undefined,
                    reason: 'Command User#0000'
                }), undefined)).thenReject(err);
            }
        },
        {
            code: '{channelcreate;My new channel}',
            expected: '`Failed to create channel: no perms`',
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Failed to create channel: no perms', 'Some other error message') }
            ],
            setup(ctx) {
                const err = ctx.createRESTError(Eris.ApiError.NOT_AUTHORIZED, 'Some other error message');
                ctx.discord.setup(m => m.createChannel(ctx.guild.id, 'My new channel', Discord.ChannelType.GuildText, argument.isDeepEqual({
                    bitrate: undefined,
                    nsfw: undefined,
                    parentID: undefined,
                    rateLimitPerUser: undefined,
                    topic: undefined,
                    userLimit: undefined,
                    permissionOverwrites: undefined,
                    reason: 'Command User#0000'
                }), undefined)).thenReject(err);
            }
        }
    ]
});
