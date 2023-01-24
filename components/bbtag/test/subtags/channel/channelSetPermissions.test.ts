import { Subtag } from '@blargbot/bbtag';
import { BBTagRuntimeError } from '@blargbot/bbtag/errors/index.js';
import { ChannelSetPermissionsSubtag } from '@blargbot/bbtag/subtags/channel/channelSetPermissions.js';
import Discord from 'discord-api-types/v9';
import * as Eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ChannelSetPermissionsSubtag),
    argCountBounds: { min: 3, max: 5 },
    setupEach(ctx) {
        ctx.roles.authorizer.permissions = (Eris.Constants.Permissions.manageChannels | Eris.Constants.Permissions.administrator).toString();
    },
    cases: [
        {
            code: '{channelsetperms;12835768123756132;member;12876318236836323}',
            expected: '12835768123756132',
            setup(ctx) {
                ctx.channels.general.id = '12835768123756132';
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);

                if (channel === undefined)
                    throw new Error('Unable to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '12835768123756132')).thenResolve([channel]);
                ctx.discord.setup(m => m.deleteChannelPermission(channel.id, '12876318236836323', 'Command User#0000')).thenResolve(undefined);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;role;12876318236836323}',
            expected: '12835768123756132',
            setup(ctx) {
                ctx.channels.general.id = '12835768123756132';
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);

                if (channel === undefined)
                    throw new Error('Unable to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '12835768123756132')).thenResolve([channel]);
                ctx.discord.setup(m => m.deleteChannelPermission(channel.id, '12876318236836323', 'Command User#0000')).thenResolve(undefined);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;member;12876318236836323;129837}',
            expected: '12835768123756132',
            setup(ctx) {
                ctx.channels.general.id = '12835768123756132';
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);

                if (channel === undefined)
                    throw new Error('Unable to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '12835768123756132')).thenResolve([channel]);
                ctx.discord.setup(m => m.editChannelPermission(channel.id, '12876318236836323', 129837n, 0n, Discord.OverwriteType.Member, 'Command User#0000')).thenResolve(undefined);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;role;12876318236836323;129837}',
            expected: '12835768123756132',
            setup(ctx) {
                ctx.channels.general.id = '12835768123756132';
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);

                if (channel === undefined)
                    throw new Error('Unable to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '12835768123756132')).thenResolve([channel]);
                ctx.discord.setup(m => m.editChannelPermission(channel.id, '12876318236836323', 129837n, 0n, Discord.OverwriteType.Role, 'Command User#0000')).thenResolve(undefined);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;member;12876318236836323;;129837}',
            expected: '12835768123756132',
            setup(ctx) {
                ctx.channels.general.id = '12835768123756132';
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);

                if (channel === undefined)
                    throw new Error('Unable to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '12835768123756132')).thenResolve([channel]);
                ctx.discord.setup(m => m.editChannelPermission(channel.id, '12876318236836323', 0n, 129837n, Discord.OverwriteType.Member, 'Command User#0000')).thenResolve(undefined);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;role;12876318236836323;;129837}',
            expected: '12835768123756132',
            setup(ctx) {
                ctx.channels.general.id = '12835768123756132';
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);

                if (channel === undefined)
                    throw new Error('Unable to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '12835768123756132')).thenResolve([channel]);
                ctx.discord.setup(m => m.editChannelPermission(channel.id, '12876318236836323', 0n, 129837n, Discord.OverwriteType.Role, 'Command User#0000')).thenResolve(undefined);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;member;12876318236836323;129837;832764}',
            expected: '12835768123756132',
            setup(ctx) {
                ctx.channels.general.id = '12835768123756132';
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);

                if (channel === undefined)
                    throw new Error('Unable to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '12835768123756132')).thenResolve([channel]);
                ctx.discord.setup(m => m.editChannelPermission(channel.id, '12876318236836323', 129837n, 832764n, Discord.OverwriteType.Member, 'Command User#0000')).thenResolve(undefined);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;role;12876318236836323;129837;832764}',
            expected: '12835768123756132',
            setup(ctx) {
                ctx.channels.general.id = '12835768123756132';
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);

                if (channel === undefined)
                    throw new Error('Unable to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '12835768123756132')).thenResolve([channel]);
                ctx.discord.setup(m => m.editChannelPermission(channel.id, '12876318236836323', 129837n, 832764n, Discord.OverwriteType.Role, 'Command User#0000')).thenResolve(undefined);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;role;12876318236836323;129837;832764}',
            expected: '`Channel does not exist`',
            errors: [
                { start: 0, end: 72, error: new BBTagRuntimeError('Channel does not exist') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findChannels(bbctx.guild, '12835768123756132')).thenResolve([]);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;role;12876318236836323;129837;832764}',
            expected: '`Cannot set permissions for a thread channel`',
            errors: [
                { start: 0, end: 72, error: new BBTagRuntimeError('Cannot set permissions for a thread channel') }
            ],
            postSetup(bbctx, ctx) {
                const channel = ctx.createMock(Eris.PublicThreadChannel);
                channel.setup(m => m.type).thenReturn(Eris.Constants.ChannelTypes.GUILD_PUBLIC_THREAD);

                ctx.util.setup(m => m.findChannels(bbctx.guild, '12835768123756132')).thenResolve([channel.instance]);
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
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);

                if (channel === undefined)
                    throw new Error('Unable to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '12835768123756132')).thenResolve([channel]);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;abc;12876318236836323;129837;832764}',
            expected: '`Type must be member or role`',
            errors: [
                { start: 0, end: 71, error: new BBTagRuntimeError('Type must be member or role') }
            ],
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);

                if (channel === undefined)
                    throw new Error('Unable to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '12835768123756132')).thenResolve([channel]);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;member;12876318236836323;129837;832764}',
            expected: '`Author missing requested permissions`',
            errors: [
                { start: 0, end: 74, error: new BBTagRuntimeError('Author missing requested permissions') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = Eris.Constants.Permissions.manageChannels.toString();
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);

                if (channel === undefined)
                    throw new Error('Unable to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '12835768123756132')).thenResolve([channel]);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;role;12876318236836323;129837;832764}',
            expected: '`Author missing requested permissions`',
            errors: [
                { start: 0, end: 72, error: new BBTagRuntimeError('Author missing requested permissions') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = Eris.Constants.Permissions.manageChannels.toString();
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);

                if (channel === undefined)
                    throw new Error('Unable to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '12835768123756132')).thenResolve([channel]);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;role;12876318236836323;129837;832764}',
            expected: '`Failed to edit channel: no perms`',
            errors: [
                { start: 0, end: 72, error: new BBTagRuntimeError('Failed to edit channel: no perms', 'Test REST error') }
            ],
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);

                if (channel === undefined)
                    throw new Error('Unable to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '12835768123756132')).thenResolve([channel]);
                const err = ctx.createRESTError(Eris.ApiError.MISSING_PERMISSIONS);
                ctx.discord.setup(m => m.editChannelPermission(channel.id, '12876318236836323', 129837n, 832764n, Discord.OverwriteType.Role, 'Command User#0000')).thenReject(err);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;role;12876318236836323;129837;832764}',
            expected: '`Failed to edit channel: no perms`',
            errors: [
                { start: 0, end: 72, error: new BBTagRuntimeError('Failed to edit channel: no perms', 'Some other error message') }
            ],
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get(ctx.channels.general.id);

                if (channel === undefined)
                    throw new Error('Unable to get channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '12835768123756132')).thenResolve([channel]);
                const err = ctx.createRESTError(Eris.ApiError.NOT_AUTHORIZED, 'Some other error message');
                ctx.discord.setup(m => m.editChannelPermission(channel.id, '12876318236836323', 129837n, 832764n, Discord.OverwriteType.Role, 'Command User#0000')).thenReject(err);
            }
        }
    ]
});
