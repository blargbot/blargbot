import { BBTagRuntimeError, ChannelType, DiscordPermissions } from '@blargbot/bbtag';
import type { CreateChannelThunk, GetUserPermissionsThunk } from '@blargbot/bbtag/subtags';
import { ChannelCreateSubtag, EscapeBBTagSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';
import { OverwriteType } from 'discord-api-types/v9';

import type { SubtagTestContext } from '../SubtagTestSuite.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

const getUserPermissions = new Mock<GetUserPermissionsThunk>({ id: 'getUserPermissions', callable: true });
const createChannel = new Mock<CreateChannelThunk>({ id: 'createChannel', callable: true });

await runSubtagTests({
    subtag: new ChannelCreateSubtag({
        getUserPermissions: getUserPermissions.instance,
        createChannel: createChannel.instance
    }),
    argCountBounds: { min: 1, max: 3 },
    names: ['channelCreate'],
    setup(ctx) {
        ctx.adoptMock(getUserPermissions);
        ctx.adoptMock(createChannel);
    },
    cases: [
        {
            code: '{channelcreate;My new channel}',
            expected: '28376128632132',
            setup(ctx) {
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id)).resolves(new DiscordPermissions(~0n)).mustHappen(1);
                createChannel.setup((m, $) => m(ctx.guild.id, $({
                    type: ChannelType.GUILD_TEXT,
                    name: 'My new channel',
                    bitrate: undefined,
                    nsfw: undefined,
                    parentID: undefined,
                    rateLimitPerUser: undefined,
                    topic: undefined,
                    userLimit: undefined,
                    permissionOverwrites: undefined,
                    reason: 'Command User#0000'
                }))).resolves({ success: true, channelId: '28376128632132' }).mustHappen(1);
            }
        },
        ...Object.entries({
            text: ChannelType.GUILD_TEXT,
            voice: ChannelType.GUILD_VOICE,
            category: ChannelType.GUILD_CATEGORY,
            news: ChannelType.GUILD_ANNOUNCEMENT,
            'stage-voice': ChannelType.GUILD_STAGE_VOICE,
            directory: ChannelType.GUILD_DIRECTORY,
            forum: ChannelType.GUILD_FORUM,
            media: ChannelType.GUILD_MEDIA
        } satisfies Record<typeof ChannelCreateSubtag['channelTypes'][number], ChannelType>).flatMap(([typeStr, type]) => [
            {
                code: `{channelcreate;My new channel;${typeStr}}`,
                expected: '28376128632132',
                setup(ctx: SubtagTestContext) {
                    getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id)).resolves(new DiscordPermissions(~0n)).mustHappen(1);
                    createChannel.setup((m, $) => m(ctx.guild.id, $({
                        type: type,
                        name: 'My new channel',
                        bitrate: undefined,
                        nsfw: undefined,
                        parentID: undefined,
                        rateLimitPerUser: undefined,
                        topic: undefined,
                        userLimit: undefined,
                        permissionOverwrites: undefined,
                        reason: 'Command User#0000'
                    }))).resolves({ success: true, channelId: '28376128632132' }).mustHappen(1);
                }
            },
            {
                code: `{channelcreate;My new channel;${typeStr};{escapebbtag;{}}}`,
                expected: '28376128632132',
                subtags: [new EscapeBBTagSubtag()],
                setup(ctx: SubtagTestContext) {
                    getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id)).resolves(new DiscordPermissions(~0n)).mustHappen(1);
                    createChannel.setup((m, $) => m(ctx.guild.id, $({
                        type: type,
                        name: 'My new channel',
                        bitrate: undefined,
                        nsfw: undefined,
                        parentID: undefined,
                        rateLimitPerUser: undefined,
                        topic: undefined,
                        userLimit: undefined,
                        permissionOverwrites: undefined,
                        reason: 'Command User#0000'
                    }))).resolves({ success: true, channelId: '28376128632132' }).mustHappen(1);
                }
            },
            {
                code: `{channelcreate;My new channel;${typeStr};{escapebbtag;${JSON.stringify({
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
                    getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id)).resolves(new DiscordPermissions(~0n)).mustHappen(1);
                    createChannel.setup((m, $) => m(ctx.guild.id, $({
                        type: type,
                        name: 'My new channel',
                        bitrate: 1234,
                        nsfw: true,
                        parentID: '23987233279389273',
                        permissionOverwrites: [
                            {
                                id: '329478923748223',
                                allow: 3827468274n,
                                deny: 42937843478n,
                                type: OverwriteType.Role
                            },
                            {
                                id: '9054786496875634',
                                allow: 23432424n,
                                deny: 432434234n,
                                type: OverwriteType.Member
                            }
                        ],
                        rateLimitPerUser: 231432,
                        topic: 'xyz123',
                        reason: 'abcdef',
                        userLimit: 32042430
                    }))).resolves({ success: true, channelId: '28376128632132' }).mustHappen(1);
                }
            },
            {
                code: `{channelcreate;My new channel;${typeStr};{escapebbtag;${JSON.stringify({
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
                    getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id)).resolves(new DiscordPermissions(~0n)).mustHappen(1);
                    createChannel.setup((m, $) => m(ctx.guild.id, $({
                        type: type,
                        name: 'My new channel',
                        bitrate: 1234,
                        nsfw: true,
                        parentID: '23987233279389273',
                        permissionOverwrites: [
                            {
                                id: '329478923748223',
                                allow: 3827468274n,
                                deny: 42937843478n,
                                type: OverwriteType.Role
                            },
                            {
                                id: '9054786496875634',
                                allow: 23432424n,
                                deny: 432434234n,
                                type: OverwriteType.Member
                            }
                        ],
                        rateLimitPerUser: 231432,
                        topic: 'xyz123',
                        reason: 'abcdef',
                        userLimit: 32042430
                    }))).resolves({ success: true, channelId: '28376128632132' }).mustHappen(1);
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
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id)).resolves(new DiscordPermissions(~0n)).mustHappen(1);
                createChannel.setup((m, $) => m(ctx.guild.id, $({
                    type: ChannelType.GUILD_TEXT,
                    name: 'My new channel',
                    bitrate: undefined,
                    nsfw: undefined,
                    parentID: undefined,
                    permissionOverwrites: [
                        {
                            id: '329478923748223',
                            allow: 0n,
                            deny: 0n,
                            type: OverwriteType.Role
                        }
                    ],
                    rateLimitPerUser: undefined,
                    topic: undefined,
                    reason: 'Command User#0000',
                    userLimit: undefined
                }))).resolves({ success: true, channelId: '28376128632132' });
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
                { error: new BBTagRuntimeError('Author missing requested permissions') }
            ],
            setup(ctx) {
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id)).resolves(DiscordPermissions.MANAGE_CHANNELS).mustHappen(1);
            }
        },
        {
            code: '{channelcreate;My new channel!}',
            expected: '`Author cannot create channels`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot create channels') }
            ],
            setup(ctx) {
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id)).resolves(DiscordPermissions.NONE).mustHappen(1);
            }
        },
        {
            code: '{channelcreate;My new channel!;;This isnt valid json!}',
            expected: '`Invalid JSON`',
            errors: [
                { error: new BBTagRuntimeError('Invalid JSON') }
            ],
            setup(ctx) {
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id)).resolves(DiscordPermissions.MANAGE_CHANNELS).mustHappen(1);
            }
        },
        {
            code: '{channelcreate;My new channel}',
            expected: '28376128632132',
            setup(ctx) {
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id)).resolves(new DiscordPermissions(~0n)).mustHappen(1);
                createChannel.setup((m, $) => m(ctx.guild.id, $({
                    type: ChannelType.GUILD_TEXT,
                    name: 'My new channel',
                    bitrate: undefined,
                    nsfw: undefined,
                    parentID: undefined,
                    rateLimitPerUser: undefined,
                    topic: undefined,
                    userLimit: undefined,
                    permissionOverwrites: undefined,
                    reason: 'Command User#0000'
                }))).resolves({ success: true, channelId: '28376128632132' }).mustHappen(1);
            }
        },
        {
            code: '{channelcreate;My new channel}',
            expected: '`Failed to create channel: no perms`',
            errors: [
                { error: new BBTagRuntimeError('Failed to create channel: no perms', 'Test REST error') }
            ],
            setup(ctx) {
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id)).resolves(new DiscordPermissions(~0n)).mustHappen(1);
                createChannel.setup((m, $) => m(ctx.guild.id, $({
                    type: ChannelType.GUILD_TEXT,
                    name: 'My new channel',
                    bitrate: undefined,
                    nsfw: undefined,
                    parentID: undefined,
                    rateLimitPerUser: undefined,
                    topic: undefined,
                    userLimit: undefined,
                    permissionOverwrites: undefined,
                    reason: 'Command User#0000'
                }))).resolves({ success: false, reason: 'Test REST error' }).mustHappen(1);
            }
        },
        {
            code: '{channelcreate;My new channel}',
            expected: '`Failed to create channel: no perms`',
            errors: [
                { error: new BBTagRuntimeError('Failed to create channel: no perms', 'Some other error message') }
            ],
            setup(ctx) {
                getUserPermissions.setup(m => m(ctx.guild.id, ctx.users.authorizer.id)).resolves(new DiscordPermissions(~0n)).mustHappen(1);
                createChannel.setup((m, $) => m(ctx.guild.id, $({
                    type: ChannelType.GUILD_TEXT,
                    name: 'My new channel',
                    bitrate: undefined,
                    nsfw: undefined,
                    parentID: undefined,
                    rateLimitPerUser: undefined,
                    topic: undefined,
                    userLimit: undefined,
                    permissionOverwrites: undefined,
                    reason: 'Command User#0000'
                }))).resolves({ success: false, reason: 'Some other error message' }).mustHappen(1);
            }
        }
    ]
});
