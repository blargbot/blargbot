import type { Entities } from '@blargbot/bbtag';
import { BBTagRuntimeError, Subtag } from '@blargbot/bbtag';
import { ChannelSetPermissionsSubtag } from '@blargbot/bbtag/subtags';
import { argument } from '@blargbot/test-util/mock.js';
import Discord from 'discord-api-types/v10';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ChannelSetPermissionsSubtag),
    argCountBounds: { min: 3, max: 5 },
    setupEach(ctx) {
        ctx.roles.authorizer.permissions = (Discord.PermissionFlagsBits.ManageChannels | Discord.PermissionFlagsBits.Administrator).toString();
    },
    cases: [
        {
            code: '{channelsetperms;12835768123756132;member;12876318236836323}',
            expected: '12835768123756132',
            setup(ctx) {
                ctx.channels.general.id = '12835768123756132';
            },
            postSetup(bbctx, ctx) {
                const channel = ctx.channels.general;
                ctx.channelService.setup(m => m.querySingle(bbctx, '12835768123756132')).thenResolve(channel);
                ctx.channelService.setup(m => m.setPermission(bbctx, channel.id, argument.isDeepEqual({
                    id: '12876318236836323',
                    allow: '0',
                    deny: '0',
                    type: Discord.OverwriteType.Member
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;role;12876318236836323}',
            expected: '12835768123756132',
            setup(ctx) {
                ctx.channels.general.id = '12835768123756132';
            },
            postSetup(bbctx, ctx) {
                const channel = ctx.channels.general;
                ctx.channelService.setup(m => m.querySingle(bbctx, '12835768123756132')).thenResolve(channel);
                ctx.channelService.setup(m => m.setPermission(bbctx, channel.id, argument.isDeepEqual({
                    id: '12876318236836323',
                    allow: '0',
                    deny: '0',
                    type: Discord.OverwriteType.Role
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;member;12876318236836323;129837}',
            expected: '12835768123756132',
            setup(ctx) {
                ctx.channels.general.id = '12835768123756132';
            },
            postSetup(bbctx, ctx) {
                const channel = ctx.channels.general;
                ctx.channelService.setup(m => m.querySingle(bbctx, '12835768123756132')).thenResolve(channel);
                ctx.channelService.setup(m => m.setPermission(bbctx, channel.id, argument.isDeepEqual({
                    id: '12876318236836323',
                    allow: '129837',
                    deny: '0',
                    type: Discord.OverwriteType.Member
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;role;12876318236836323;129837}',
            expected: '12835768123756132',
            setup(ctx) {
                ctx.channels.general.id = '12835768123756132';
            },
            postSetup(bbctx, ctx) {
                const channel = ctx.channels.general;
                ctx.channelService.setup(m => m.querySingle(bbctx, '12835768123756132')).thenResolve(channel);
                ctx.channelService.setup(m => m.setPermission(bbctx, channel.id, argument.isDeepEqual({
                    id: '12876318236836323',
                    allow: '129837',
                    deny: '0',
                    type: Discord.OverwriteType.Role
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;member;12876318236836323;;129837}',
            expected: '12835768123756132',
            setup(ctx) {
                ctx.channels.general.id = '12835768123756132';
            },
            postSetup(bbctx, ctx) {
                const channel = ctx.channels.general;
                ctx.channelService.setup(m => m.querySingle(bbctx, '12835768123756132')).thenResolve(channel);
                ctx.channelService.setup(m => m.setPermission(bbctx, channel.id, argument.isDeepEqual({
                    id: '12876318236836323',
                    allow: '0',
                    deny: '129837',
                    type: Discord.OverwriteType.Member
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;role;12876318236836323;;129837}',
            expected: '12835768123756132',
            setup(ctx) {
                ctx.channels.general.id = '12835768123756132';
            },
            postSetup(bbctx, ctx) {
                const channel = ctx.channels.general;
                ctx.channelService.setup(m => m.querySingle(bbctx, '12835768123756132')).thenResolve(channel);
                ctx.channelService.setup(m => m.setPermission(bbctx, channel.id, argument.isDeepEqual({
                    id: '12876318236836323',
                    allow: '0',
                    deny: '129837',
                    type: Discord.OverwriteType.Role
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;member;12876318236836323;129837;832764}',
            expected: '12835768123756132',
            setup(ctx) {
                ctx.channels.general.id = '12835768123756132';
            },
            postSetup(bbctx, ctx) {
                const channel = ctx.channels.general;
                ctx.channelService.setup(m => m.querySingle(bbctx, '12835768123756132')).thenResolve(channel);
                ctx.channelService.setup(m => m.setPermission(bbctx, channel.id, argument.isDeepEqual({
                    id: '12876318236836323',
                    allow: '129837',
                    deny: '832764',
                    type: Discord.OverwriteType.Member
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;role;12876318236836323;129837;832764}',
            expected: '12835768123756132',
            setup(ctx) {
                ctx.channels.general.id = '12835768123756132';
            },
            postSetup(bbctx, ctx) {
                const channel = ctx.channels.general;
                ctx.channelService.setup(m => m.querySingle(bbctx, '12835768123756132')).thenResolve(channel);
                ctx.channelService.setup(m => m.setPermission(bbctx, channel.id, argument.isDeepEqual({
                    id: '12876318236836323',
                    allow: '129837',
                    deny: '832764',
                    type: Discord.OverwriteType.Role
                }))).thenResolve(undefined);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;role;12876318236836323;129837;832764}',
            expected: '`Channel does not exist`',
            errors: [
                { start: 0, end: 72, error: new BBTagRuntimeError('Channel does not exist') }
            ],
            postSetup(bbctx, ctx) {
                ctx.channelService.setup(m => m.querySingle(bbctx, '12835768123756132')).thenResolve();
            }
        },
        {
            code: '{channelsetperms;12835768123756132;role;12876318236836323;129837;832764}',
            expected: '`Cannot set permissions for a thread channel`',
            errors: [
                { start: 0, end: 72, error: new BBTagRuntimeError('Cannot set permissions for a thread channel') }
            ],
            postSetup(bbctx, ctx) {
                const channel = ctx.createMock<Entities.Channel>();
                channel.setup(m => m.type).thenReturn(Discord.ChannelType.PublicThread);

                ctx.channelService.setup(m => m.querySingle(bbctx, '12835768123756132')).thenResolve(channel.instance);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;role;12876318236836323;129837;832764}',
            expected: '`Author cannot edit this channel`',
            errors: [
                { start: 0, end: 72, error: new BBTagRuntimeError('Author cannot edit this channel') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = '0';
            },
            postSetup(bbctx, ctx) {
                const channel = ctx.channels.general;
                ctx.channelService.setup(m => m.querySingle(bbctx, '12835768123756132')).thenResolve(channel);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;abc;12876318236836323;129837;832764}',
            expected: '`Type must be member or role`',
            errors: [
                { start: 0, end: 71, error: new BBTagRuntimeError('Type must be member or role') }
            ],
            postSetup(bbctx, ctx) {
                const channel = ctx.channels.general;
                ctx.channelService.setup(m => m.querySingle(bbctx, '12835768123756132')).thenResolve(channel);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;member;12876318236836323;129837;832764}',
            expected: '`Author missing requested permissions`',
            errors: [
                { start: 0, end: 74, error: new BBTagRuntimeError('Author missing requested permissions') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = Discord.PermissionFlagsBits.ManageChannels.toString();
            },
            postSetup(bbctx, ctx) {
                const channel = ctx.channels.general;
                ctx.channelService.setup(m => m.querySingle(bbctx, '12835768123756132')).thenResolve(channel);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;role;12876318236836323;129837;832764}',
            expected: '`Author missing requested permissions`',
            errors: [
                { start: 0, end: 72, error: new BBTagRuntimeError('Author missing requested permissions') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = Discord.PermissionFlagsBits.ManageChannels.toString();
            },
            postSetup(bbctx, ctx) {
                const channel = ctx.channels.general;
                ctx.channelService.setup(m => m.querySingle(bbctx, '12835768123756132')).thenResolve(channel);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;role;12876318236836323;129837;832764}',
            expected: '`Failed to edit channel: no perms`',
            errors: [
                { start: 0, end: 72, error: new BBTagRuntimeError('Failed to edit channel: no perms', 'Test REST error') }
            ],
            postSetup(bbctx, ctx) {
                const channel = ctx.channels.general;
                ctx.channelService.setup(m => m.querySingle(bbctx, '12835768123756132')).thenResolve(channel);
                ctx.channelService.setup(m => m.setPermission(bbctx, channel.id, argument.isDeepEqual({
                    id: '12876318236836323',
                    allow: '129837',
                    deny: '832764',
                    type: Discord.OverwriteType.Role
                }))).thenResolve({ error: 'Test REST error' });
            }
        },
        {
            code: '{channelsetperms;12835768123756132;role;12876318236836323;129837;832764}',
            expected: '`Failed to edit channel: no perms`',
            errors: [
                { start: 0, end: 72, error: new BBTagRuntimeError('Failed to edit channel: no perms', 'Some other error message') }
            ],
            postSetup(bbctx, ctx) {
                const channel = ctx.channels.general;
                ctx.channelService.setup(m => m.querySingle(bbctx, '12835768123756132')).thenResolve(channel);
                ctx.channelService.setup(m => m.setPermission(bbctx, channel.id, argument.isDeepEqual({
                    id: '12876318236836323',
                    allow: '129837',
                    deny: '832764',
                    type: Discord.OverwriteType.Role
                }))).thenResolve({ error: 'Some other error message' });
            }
        }
    ]
});
