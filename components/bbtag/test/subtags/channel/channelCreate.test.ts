import type { BBTagContext, Entities } from '@bbtag/blargbot';
import { BBTagRuntimeError, Subtag } from '@bbtag/blargbot';
import { ChannelCreateSubtag, EscapeBBTagSubtag } from '@bbtag/blargbot/subtags';
import { argument } from '@blargbot/test-util/mock.js';
import Discord from '@blargbot/discord-types';

import type { SubtagTestContext } from '../SubtagTestSuite.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ChannelCreateSubtag),
    argCountBounds: { min: 1, max: 3 },
    setupEach(ctx) {
        ctx.roles.authorizer.permissions = Discord.PermissionFlagsBits.Administrator.toString();
    },
    cases: [
        {
            code: '{channelcreate;My new channel}',
            expected: '28376128632132',
            postSetup(bbctx, ctx) {
                const channel = ctx.createMock<Entities.Channel>();
                channel.setup(m => m.id).thenReturn('28376128632132');

                ctx.channelService.setup(m => m.create(bbctx, argument.isDeepEqual({
                    type: Discord.ChannelType.GuildText,
                    name: 'My new channel',
                    bitrate: undefined,
                    nsfw: undefined,
                    parentID: undefined,
                    rateLimitPerUser: undefined,
                    topic: undefined,
                    userLimit: undefined,
                    permissionOverwrites: undefined
                }), undefined)).thenResolve(channel.instance);
            }
        },
        ...([
            { type: 'text', code: Discord.ChannelType.GuildText },
            { type: 'voice', code: Discord.ChannelType.GuildVoice },
            { type: 'category', code: Discord.ChannelType.GuildCategory },
            { type: 'news', code: Discord.ChannelType.GuildAnnouncement },
            { type: 'this is some garbage', code: Discord.ChannelType.GuildText },
            { type: '', code: Discord.ChannelType.GuildText }
        ] as Array<{ type: string; code: Entities.Channel['type']; }>).flatMap(({ type, code }) => [
            {
                code: `{channelcreate;My new channel;${type}}`,
                expected: '28376128632132',
                postSetup(bbctx: BBTagContext, ctx: SubtagTestContext) {
                    const channel = ctx.createMock<Entities.Channel>();
                    channel.setup(m => m.type, false).thenReturn(code);
                    channel.setup(m => m.id).thenReturn('28376128632132');

                    ctx.channelService.setup(m => m.create(bbctx, argument.isDeepEqual({
                        name: 'My new channel',
                        type: code,
                        bitrate: undefined,
                        nsfw: undefined,
                        parentID: undefined,
                        rateLimitPerUser: undefined,
                        topic: undefined,
                        userLimit: undefined,
                        permissionOverwrites: undefined
                    }), undefined)).thenResolve(channel.instance);
                }
            },
            {
                code: `{channelcreate;My new channel;${type};{escapebbtag;{}}}`,
                expected: '28376128632132',
                subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
                postSetup(bbctx: BBTagContext, ctx: SubtagTestContext) {
                    const channel = ctx.createMock<Entities.Channel>();
                    channel.setup(m => m.type, false).thenReturn(code);
                    channel.setup(m => m.id).thenReturn('28376128632132');

                    ctx.channelService.setup(m => m.create(bbctx, argument.isDeepEqual({
                        name: 'My new channel',
                        type: code,
                        bitrate: undefined,
                        nsfw: undefined,
                        parentID: undefined,
                        rateLimitPerUser: undefined,
                        topic: undefined,
                        userLimit: undefined,
                        permissionOverwrites: undefined
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
                subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
                postSetup(bbctx: BBTagContext, ctx: SubtagTestContext) {
                    const channel = ctx.createMock<Entities.Channel>();
                    channel.setup(m => m.type, false).thenReturn(code);
                    channel.setup(m => m.id).thenReturn('28376128632132');

                    ctx.channelService.setup(m => m.create(bbctx, argument.isDeepEqual({
                        name: 'My new channel',
                        type: code,
                        bitrate: 1234,
                        nsfw: true,
                        parentID: '23987233279389273',
                        permissionOverwrites: [
                            {
                                id: '329478923748223',
                                allow: '3827468274',
                                deny: '42937843478',
                                type: Discord.OverwriteType.Role
                            },
                            {
                                id: '9054786496875634',
                                allow: '23432424',
                                deny: '432434234',
                                type: Discord.OverwriteType.Member
                            }
                        ],
                        rateLimitPerUser: 231432,
                        topic: 'xyz123',
                        userLimit: 32042430
                    }), 'abcdef')).thenResolve(channel.instance);
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
                subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
                postSetup(bbctx: BBTagContext, ctx: SubtagTestContext) {
                    const channel = ctx.createMock<Entities.Channel>();
                    channel.setup(m => m.type, false).thenReturn(code);
                    channel.setup(m => m.id).thenReturn('28376128632132');

                    ctx.channelService.setup(m => m.create(bbctx, argument.isDeepEqual({
                        name: 'My new channel',
                        type: code,
                        bitrate: 1234,
                        nsfw: true,
                        parentID: '23987233279389273',
                        permissionOverwrites: [
                            {
                                id: '329478923748223',
                                allow: '3827468274',
                                deny: '42937843478',
                                type: Discord.OverwriteType.Role
                            },
                            {
                                id: '9054786496875634',
                                allow: '23432424',
                                deny: '432434234',
                                type: Discord.OverwriteType.Member
                            }
                        ],
                        rateLimitPerUser: 231432,
                        topic: 'xyz123',
                        userLimit: 32042430
                    }), 'abcdef')).thenResolve(channel.instance);
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
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            postSetup(bbctx: BBTagContext, ctx: SubtagTestContext) {
                const channel = ctx.createMock<Entities.Channel>();
                channel.setup(m => m.type, false).thenReturn(Discord.ChannelType.GuildText);
                channel.setup(m => m.id).thenReturn('28376128632132');

                ctx.channelService.setup(m => m.create(bbctx, argument.isDeepEqual({
                    name: 'My new channel',
                    type: Discord.ChannelType.GuildText,
                    bitrate: undefined,
                    nsfw: undefined,
                    parentID: undefined,
                    permissionOverwrites: [
                        {
                            id: '329478923748223',
                            allow: '0',
                            deny: '0',
                            type: Discord.OverwriteType.Role
                        }
                    ],
                    rateLimitPerUser: undefined,
                    topic: undefined,
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
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            errors: [
                { start: 0, end: 124, error: new BBTagRuntimeError('Author missing requested permissions') }
            ],
            setup(ctx: SubtagTestContext) {
                ctx.roles.authorizer.permissions = Discord.PermissionFlagsBits.ManageChannels.toString();
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
            postSetup(bbctx, ctx) {
                const channel = ctx.createMock<Entities.Channel>();
                channel.setup(m => m.type, false).thenReturn(Discord.ChannelType.GuildText);
                channel.setup(m => m.id).thenReturn('28376128632132');

                ctx.channelService.setup(m => m.create(bbctx, argument.isDeepEqual({
                    name: 'My new channel',
                    type: Discord.ChannelType.GuildText,
                    bitrate: undefined,
                    nsfw: undefined,
                    parentID: undefined,
                    rateLimitPerUser: undefined,
                    topic: undefined,
                    userLimit: undefined,
                    permissionOverwrites: undefined
                }), undefined)).thenResolve(channel.instance);
            }
        },
        {
            code: '{channelcreate;My new channel}',
            expected: '`Failed to create channel: no perms`',
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Failed to create channel: no perms', 'Test REST error') }
            ],
            postSetup(bbctx, ctx) {
                ctx.channelService.setup(m => m.create(bbctx, argument.isDeepEqual({
                    name: 'My new channel',
                    type: Discord.ChannelType.GuildText,
                    bitrate: undefined,
                    nsfw: undefined,
                    parentID: undefined,
                    rateLimitPerUser: undefined,
                    topic: undefined,
                    userLimit: undefined,
                    permissionOverwrites: undefined
                }), undefined)).thenResolve({ error: 'Test REST error' });
            }
        },
        {
            code: '{channelcreate;My new channel}',
            expected: '`Failed to create channel: no perms`',
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Failed to create channel: no perms', 'Some other error message') }
            ],
            postSetup(bbctx, ctx) {
                ctx.channelService.setup(m => m.create(bbctx, argument.isDeepEqual({
                    name: 'My new channel',
                    type: Discord.ChannelType.GuildText,
                    bitrate: undefined,
                    nsfw: undefined,
                    parentID: undefined,
                    rateLimitPerUser: undefined,
                    topic: undefined,
                    userLimit: undefined,
                    permissionOverwrites: undefined
                }), undefined)).thenResolve({ error: 'Some other error message' });
            }
        }
    ]
});
