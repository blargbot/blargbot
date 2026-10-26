import { BBTagRuntimeError, DiscordPermissions, RoleNotFoundError, UserNotFoundError } from '@blargbot/bbtag';
import type { GetMemberPermissionsFeature, ListGuildRolesFeature, ListMemberRolesFeature, RemoveMemberRolesFeature } from '@blargbot/bbtag/subtags';
import { RoleRemoveSubtag, UserIdSubtag } from '@blargbot/bbtag/subtags';
import { snowflake } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<RemoveMemberRolesFeature & ListMemberRolesFeature & ListGuildRolesFeature & GetMemberPermissionsFeature>({ id: 'features' });
const userIdSubtag = new Mock<UserIdSubtag>({ id: 'UserIdSubtag' });

await runSubtagTests({
    subtag: new RoleRemoveSubtag(features.instance),
    argCountBounds: { min: 1, max: 3 },
    names: ['roleRemove', 'removeRole'],
    otherSubtags: [userIdSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptSubtagMock(userIdSubtag, { type: UserIdSubtag });
    },
    cases: [
        {
            title: 'User has the role',
            code: '{roleremove;3298746326924}',
            expected: 'true',
            setup(ctx) {
                const guildId = ctx.guild.id;
                const roleIds = ['3298746326924'];
                const adminId = snowflake.create().toString();
                const userId = ctx.users.command.id;
                const botId = ctx.users.bot.id;
                const modId = ctx.users.authorizer.id;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, userId)).resolves([guildId, ...roleIds]).mustHappen(1);
                features.setup((m, $) => m.removeMemberRoles($({
                    guildId,
                    targetId: userId,
                    roleIds: roleIds,
                    auditReason: 'Command User#0000'
                }))).resolves({ success: true }).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                userIdSubtag.setup((m, $) => m.query(bbctx, ctx.users.command.id, $({ noLookup: false })))
                    .resolves(ctx.users.command.id)
                    .mustHappen(1);
            }
        },
        {
            title: 'User is missing the role',
            code: '{roleremove;3298746326924}',
            expected: 'false',
            setup(ctx) {
                const guildId = ctx.guild.id;
                const roleIds = ['3298746326924'];
                const adminId = snowflake.create().toString();
                const userId = ctx.users.command.id;
                const botId = ctx.users.bot.id;
                const modId = ctx.users.authorizer.id;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, userId)).resolves([guildId]).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                userIdSubtag.setup((m, $) => m.query(bbctx, ctx.users.command.id, $({ noLookup: false })))
                    .resolves(ctx.users.command.id)
                    .mustHappen(1);
            }
        },
        {
            code: '{roleremove;["3298746326924","9238476938485"]}',
            expected: 'true',
            setup(ctx) {
                const guildId = ctx.guild.id;
                const roleIds = ['3298746326924', '9238476938485'];
                const adminId = snowflake.create().toString();
                const userId = ctx.users.command.id;
                const botId = ctx.users.bot.id;
                const modId = ctx.users.authorizer.id;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, userId)).resolves([guildId, ...roleIds]).mustHappen(1);
                features.setup((m, $) => m.removeMemberRoles($({
                    guildId,
                    targetId: userId,
                    roleIds: roleIds,
                    auditReason: 'Command User#0000'
                }))).resolves({ success: true }).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                userIdSubtag.setup((m, $) => m.query(bbctx, ctx.users.command.id, $({ noLookup: false })))
                    .resolves(ctx.users.command.id)
                    .mustHappen(1);
            }
        },
        {
            code: '{roleremove;["3298746326924",null]}',
            expected: 'true',
            setup(ctx) {
                const guildId = ctx.guild.id;
                const roleIds = ['3298746326924'];
                const adminId = snowflake.create().toString();
                const userId = ctx.users.command.id;
                const botId = ctx.users.bot.id;
                const modId = ctx.users.authorizer.id;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, userId)).resolves([guildId, ...roleIds]).mustHappen(1);
                features.setup((m, $) => m.removeMemberRoles($({
                    guildId,
                    targetId: userId,
                    roleIds: roleIds,
                    auditReason: 'Command User#0000'
                }))).resolves({ success: true }).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                userIdSubtag.setup((m, $) => m.query(bbctx, ctx.users.command.id, $({ noLookup: false })))
                    .resolves(ctx.users.command.id)
                    .mustHappen(1);
            }
        },
        {
            code: '{roleremove;3298746326924}',
            expected: '`Author cannot remove roles`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot remove roles') }
            ],
            setup(ctx) {
                const guildId = ctx.guild.id;
                const roleIds = ['3298746326924', '9238476938485'];
                const adminId = snowflake.create().toString();
                const botId = ctx.users.bot.id;
                const modId = ctx.users.authorizer.id;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.NONE).mustHappen(1);
            }
        },
        {
            code: '{roleremove;3298746326924}',
            expected: '`Role above author`',
            errors: [
                { error: new BBTagRuntimeError('Role above author') }
            ],
            setup(ctx) {
                const guildId = ctx.guild.id;
                const roleIds = ['3298746326924'];
                const adminId = snowflake.create().toString();
                const botId = ctx.users.bot.id;
                const modId = ctx.users.authorizer.id;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, ...roleIds]).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                userIdSubtag.setup((m, $) => m.query(bbctx, ctx.users.command.id, $({ noLookup: false })))
                    .resolves(ctx.users.command.id)
                    .mustHappen(1);
            }
        },
        {
            code: '{roleremove;3298746326924}',
            expected: '`No role found`',
            errors: [
                { error: new RoleNotFoundError('3298746326924') }
            ],
            setup(ctx) {
                const guildId = ctx.guild.id;
                const adminId = snowflake.create().toString();
                const botId = ctx.users.bot.id;
                const modId = ctx.users.authorizer.id;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                userIdSubtag.setup((m, $) => m.query(bbctx, ctx.users.command.id, $({ noLookup: false })))
                    .resolves(ctx.users.command.id)
                    .mustHappen(1);
            }
        },
        {
            code: '{roleremove;3298746326924;other user}',
            expected: 'true',
            setup(ctx) {
                const guildId = ctx.guild.id;
                const roleIds = ['3298746326924'];
                const adminId = snowflake.create().toString();
                const userId = ctx.users.other.id;
                const botId = ctx.users.bot.id;
                const modId = ctx.users.authorizer.id;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, userId)).resolves([guildId, ...roleIds]).mustHappen(1);
                features.setup((m, $) => m.removeMemberRoles($({
                    guildId,
                    targetId: userId,
                    roleIds: roleIds,
                    auditReason: 'Command User#0000'
                }))).resolves({ success: true }).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: false })))
                    .resolves(ctx.users.other.id)
                    .mustHappen(1);
            }
        },
        {
            code: '{roleremove;3298746326924;other user}',
            expected: '`No user found`',
            errors: [
                { error: new UserNotFoundError('other user') }
            ],
            setup(ctx) {
                const guildId = ctx.guild.id;
                const roleIds = ['3298746326924'];
                const adminId = snowflake.create().toString();
                const botId = ctx.users.bot.id;
                const modId = ctx.users.authorizer.id;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
            },
            postSetup(bbctx) {
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: false })))
                    .resolves(undefined)
                    .mustHappen(1);
            }
        },
        {
            code: '{roleremove;3298746326924;other user}',
            expected: 'false',
            errors: [
                { error: new UserNotFoundError('other user').withDisplay('false') }
            ],
            setup(ctx) {
                const guildId = ctx.guild.id;
                const roleIds = ['3298746326924'];
                const adminId = snowflake.create().toString();
                const botId = ctx.users.bot.id;
                const modId = ctx.users.authorizer.id;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
            },
            postSetup(bbctx) {
                bbctx.root.quiet = true;
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true })))
                    .resolves(undefined)
                    .mustHappen(1);
            }
        },
        {
            code: '{roleremove;3298746326924;other user;q}',
            expected: 'false',
            errors: [
                { error: new UserNotFoundError('other user').withDisplay('false') }
            ],
            setup(ctx) {
                const guildId = ctx.guild.id;
                const roleIds = ['3298746326924'];
                const adminId = snowflake.create().toString();
                const botId = ctx.users.bot.id;
                const modId = ctx.users.authorizer.id;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
            },
            postSetup(bbctx) {
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: true })))
                    .resolves(undefined)
                    .mustHappen(1);
            }
        }
    ]
});
