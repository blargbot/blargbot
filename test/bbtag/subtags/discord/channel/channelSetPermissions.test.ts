import type { ChannelTypeName, GuildChannelSetPermissionLocals } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, ChannelType, DiscordPermissions, FailedToEditChannelNoPermsError, LegacyChannelNotFoundError, PermissionOverwriteType, replacers } from '@blargbot/bbtag-engine';

import { randomSnowflake } from '../../randomSnowflake.js';
import type { SubtagTestContext } from '../../SubtagTestSuite.js';
import { runSubtagTests } from '../../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.channelSetPermissionsReplacer,
    names: ['channelSetPermissions', 'channelSetPerms'],
    argCountBounds: { min: 3, max: 5 },
    cases: [
        ...[
            { kindStr: 'role', kindValue: PermissionOverwriteType.ROLE },
            { kindStr: 'ROLE', kindValue: PermissionOverwriteType.ROLE },
            { kindStr: '0', kindValue: PermissionOverwriteType.ROLE },
            { kindStr: 'member', kindValue: PermissionOverwriteType.MEMBER },
            { kindStr: 'MEMBER', kindValue: PermissionOverwriteType.MEMBER },
            { kindStr: '1', kindValue: PermissionOverwriteType.MEMBER }
        ].flatMap(({ kindStr, kindValue }) => Object.entries({
            GUILD_TEXT: true,
            DM: true,
            GUILD_VOICE: true,
            GROUP_DM: true,
            GUILD_CATEGORY: true,
            GUILD_ANNOUNCEMENT: true,
            ANNOUNCEMENT_THREAD: false,
            PUBLIC_THREAD: false,
            PRIVATE_THREAD: false,
            GUILD_STAGE_VOICE: true,
            GUILD_DIRECTORY: true,
            GUILD_FORUM: true,
            GUILD_MEDIA: true
        } satisfies Record<ChannelTypeName, boolean>).flatMap(([type, success]) => [
            {
                title: `Channel type is ${type}`,
                code: `{channelsetperms;12835768123756132;${kindStr};12876318236836323}`,
                expected: success ? '12835768123756132' : '`Cannot set permissions for a thread channel`',
                errors: success ? [] : [{ error: new BBTagRuntimeError('Cannot set permissions for a thread channel') }],
                setup(ctx: SubtagTestContext<GuildChannelSetPermissionLocals>) {
                    const channelId = 12835768123756132n;
                    ctx.discord.setup((m, $) => m.queryChannel('12835768123756132', $({ throw: LegacyChannelNotFoundError })))
                        .resolves(channelId)
                        .mustHappen(1);
                    ctx.discord.setup(m => m.getChannelType(channelId)).resolves(ChannelType[type]).mustHappen(1);
                    if (!success)
                        return;
                    const botId = randomSnowflake('botId');
                    const authorizerId = randomSnowflake('authorizerId');
                    ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                    ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                    ctx.discord.setup(m => m.getPermissions(botId, channelId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                    ctx.discord.setup(m => m.getPermissions(authorizerId, channelId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                    ctx.discord.setup(m => m.setChannelPermission(channelId, 12876318236836323n, kindValue, 0n, 0n)).resolves(true).mustHappen(1);
                }
            },
            {
                title: `Channel type is ${type}`,
                code: `{channelsetperms;12835768123756132;${kindStr};12876318236836323;123456}`,
                expected: success ? '12835768123756132' : '`Cannot set permissions for a thread channel`',
                errors: success ? [] : [{ error: new BBTagRuntimeError('Cannot set permissions for a thread channel') }],
                setup(ctx: SubtagTestContext<GuildChannelSetPermissionLocals>) {
                    const channelId = 12835768123756132n;
                    ctx.discord.setup((m, $) => m.queryChannel('12835768123756132', $({ throw: LegacyChannelNotFoundError })))
                        .resolves(channelId)
                        .mustHappen(1);
                    ctx.discord.setup(m => m.getChannelType(channelId)).resolves(ChannelType[type]).mustHappen(1);
                    if (!success)
                        return;
                    const botId = randomSnowflake('botId');
                    const authorizerId = randomSnowflake('authorizerId');
                    ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                    ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                    ctx.discord.setup(m => m.getPermissions(botId, channelId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                    ctx.discord.setup(m => m.getPermissions(authorizerId, channelId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                    ctx.discord.setup(m => m.setChannelPermission(channelId, 12876318236836323n, kindValue, 123456n, 0n)).resolves(true).mustHappen(1);
                }
            },
            {
                title: `Channel type is ${type}`,
                code: `{channelsetperms;12835768123756132;${kindStr};12876318236836323;;654321}`,
                expected: success ? '12835768123756132' : '`Cannot set permissions for a thread channel`',
                errors: success ? [] : [{ error: new BBTagRuntimeError('Cannot set permissions for a thread channel') }],
                setup(ctx: SubtagTestContext<GuildChannelSetPermissionLocals>) {
                    const channelId = 12835768123756132n;
                    ctx.discord.setup((m, $) => m.queryChannel('12835768123756132', $({ throw: LegacyChannelNotFoundError })))
                        .resolves(channelId)
                        .mustHappen(1);
                    ctx.discord.setup(m => m.getChannelType(channelId)).resolves(ChannelType[type]).mustHappen(1);
                    if (!success)
                        return;
                    const botId = randomSnowflake('botId');
                    const authorizerId = randomSnowflake('authorizerId');
                    ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                    ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                    ctx.discord.setup(m => m.getPermissions(botId, channelId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                    ctx.discord.setup(m => m.getPermissions(authorizerId, channelId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                    ctx.discord.setup(m => m.setChannelPermission(channelId, 12876318236836323n, kindValue, 0n, 654321n)).resolves(true).mustHappen(1);
                }
            },
            {
                title: `Channel type is ${type}`,
                code: `{channelsetperms;12835768123756132;${kindStr};12876318236836323;123456;654321}`,
                expected: success ? '12835768123756132' : '`Cannot set permissions for a thread channel`',
                errors: success ? [] : [{ error: new BBTagRuntimeError('Cannot set permissions for a thread channel') }],
                setup(ctx: SubtagTestContext<GuildChannelSetPermissionLocals>) {
                    const channelId = 12835768123756132n;
                    ctx.discord.setup((m, $) => m.queryChannel('12835768123756132', $({ throw: LegacyChannelNotFoundError })))
                        .resolves(channelId)
                        .mustHappen(1);
                    ctx.discord.setup(m => m.getChannelType(channelId)).resolves(ChannelType[type]).mustHappen(1);
                    if (!success)
                        return;
                    const botId = randomSnowflake('botId');
                    const authorizerId = randomSnowflake('authorizerId');
                    ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                    ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                    ctx.discord.setup(m => m.getPermissions(botId, channelId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                    ctx.discord.setup(m => m.getPermissions(authorizerId, channelId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                    ctx.discord.setup(m => m.setChannelPermission(channelId, 12876318236836323n, kindValue, 123456n, 654321n)).resolves(true).mustHappen(1);
                }
            }
        ])),
        {
            code: '{channelsetperms;12835768123756132;role;12876318236836323;129837;832764}',
            expected: '`Channel does not exist`',
            errors: [
                { error: new LegacyChannelNotFoundError('12835768123756132') }
            ],
            setup(ctx) {
                ctx.discord.setup((m, $) => m.queryChannel('12835768123756132', $({ throw: LegacyChannelNotFoundError })))
                    .rejects(new LegacyChannelNotFoundError('12835768123756132'))
                    .mustHappen(1);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;role;12876318236836323;129837;832764}',
            expected: '`Author cannot edit this channel`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot edit this channel') }
            ],
            setup(ctx) {
                const channelId = randomSnowflake('channelId');
                const authorizerId = randomSnowflake('authorizerId');
                ctx.discord.setup((m, $) => m.queryChannel('12835768123756132', $({ throw: LegacyChannelNotFoundError })))
                    .resolves(channelId)
                    .mustHappen(1);
                ctx.discord.setup(m => m.getChannelType(channelId)).resolves(ChannelType.GUILD_TEXT).mustHappen(1);
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(authorizerId, channelId)).resolves(DiscordPermissions.NONE).mustHappen(1);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;abc;12876318236836323;129837;832764}',
            expected: '`Type must be member or role`',
            errors: [
                { error: new BBTagRuntimeError('Type must be member or role') }
            ],
            setup(ctx) {
                const channelId = randomSnowflake('channelId');
                ctx.discord.setup((m, $) => m.queryChannel('12835768123756132', $({ throw: LegacyChannelNotFoundError })))
                    .resolves(channelId)
                    .mustHappen(1);
                ctx.discord.setup(m => m.getChannelType(channelId)).resolves(ChannelType.GUILD_TEXT).mustHappen(1);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;member;12876318236836323;129837;832764}',
            expected: '`Author cannot edit this channel`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot edit this channel') }
            ],
            setup(ctx) {
                const channelId = 12835768123756132n;
                const authorizerId = randomSnowflake('authorizerId');
                ctx.discord.setup((m, $) => m.queryChannel('12835768123756132', $({ throw: LegacyChannelNotFoundError })))
                    .resolves(channelId)
                    .mustHappen(1);
                ctx.discord.setup(m => m.getChannelType(channelId)).resolves(ChannelType.GUILD_TEXT).mustHappen(1);
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(authorizerId, channelId)).resolves(DiscordPermissions.NONE).mustHappen(1);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;member;12876318236836323;129837;832764}',
            expected: '`Author missing requested permissions`',
            errors: [
                { error: new BBTagRuntimeError('Author missing requested permissions') }
            ],
            setup(ctx) {
                const channelId = 12835768123756132n;
                const authorizerId = randomSnowflake('authorizerId');
                ctx.discord.setup((m, $) => m.queryChannel('12835768123756132', $({ throw: LegacyChannelNotFoundError })))
                    .resolves(channelId)
                    .mustHappen(1);
                ctx.discord.setup(m => m.getChannelType(channelId)).resolves(ChannelType.GUILD_TEXT).mustHappen(1);
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(authorizerId, channelId)).resolves(DiscordPermissions.MANAGE_CHANNELS).mustHappen(1);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;member;12876318236836323;129837;832764}',
            expected: '`Failed to edit channel: no perms`',
            errors: [
                { error: new FailedToEditChannelNoPermsError() }
            ],
            setup(ctx) {
                const channelId = 12835768123756132n;
                const botId = randomSnowflake('botId');
                const authorizerId = randomSnowflake('authorizerId');
                ctx.discord.setup((m, $) => m.queryChannel('12835768123756132', $({ throw: LegacyChannelNotFoundError })))
                    .resolves(channelId)
                    .mustHappen(1);
                ctx.discord.setup(m => m.getChannelType(channelId)).resolves(ChannelType.GUILD_TEXT).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId, channelId)).resolves(DiscordPermissions.NONE).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(authorizerId, channelId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;member;12876318236836323;129837;832764}',
            expected: '`Failed to edit channel: no perms`',
            errors: [
                { error: new FailedToEditChannelNoPermsError() }
            ],
            setup(ctx) {
                const channelId = 12835768123756132n;
                const botId = randomSnowflake('botId');
                const authorizerId = randomSnowflake('authorizerId');
                ctx.discord.setup((m, $) => m.queryChannel('12835768123756132', $({ throw: LegacyChannelNotFoundError })))
                    .resolves(channelId)
                    .mustHappen(1);
                ctx.discord.setup(m => m.getChannelType(channelId)).resolves(ChannelType.GUILD_TEXT).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId, channelId)).resolves(DiscordPermissions.MANAGE_CHANNELS).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(authorizerId, channelId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
            }
        },
        {
            code: '{channelsetperms;12835768123756132;member;12876318236836323;129837;832764}',
            expected: '`Failed to edit channel: no perms`',
            errors: [
                { error: new FailedToEditChannelNoPermsError() }
            ],
            setup(ctx) {
                const channelId = 12835768123756132n;
                const botId = randomSnowflake('botId');
                const authorizerId = randomSnowflake('authorizerId');
                ctx.discord.setup((m, $) => m.queryChannel('12835768123756132', $({ throw: LegacyChannelNotFoundError })))
                    .resolves(channelId)
                    .mustHappen(1);
                ctx.discord.setup(m => m.getChannelType(channelId)).resolves(ChannelType.GUILD_TEXT).mustHappen(1);
                ctx.discord.setup(m => m.botId).returns(botId).mustHappen(1);
                ctx.discord.setup(m => m.authorizerId).returns(authorizerId).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(botId, channelId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                ctx.discord.setup(m => m.getPermissions(authorizerId, channelId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                ctx.discord.setup(m => m.setChannelPermission(channelId, 12876318236836323n, PermissionOverwriteType.MEMBER, 129837n, 832764n)).resolves(false).mustHappen(1);
            }
        }
    ]
});
