import { BBTagRuntimeError, DiscordPermissions } from '@blargbot/bbtag';
import type { CreateRoleFeature, GetMemberPermissionsFeature, ListGuildRolesFeature, ListMemberRolesFeature } from '@blargbot/bbtag/subtags';
import { ReasonSubtag, RoleCreateSubtag } from '@blargbot/bbtag/subtags';
import { snowflake } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<CreateRoleFeature & GetMemberPermissionsFeature & ListGuildRolesFeature & ListMemberRolesFeature>({ id: 'features' });
const reasonSubtag = new Mock<ReasonSubtag>({ id: 'ReasonSubtag' });
const manyPerms = new DiscordPermissions(
    'BAN_MEMBERS',
    'VIEW_AUDIT_LOG',
    'SEND_MESSAGES',
    'MANAGE_MESSAGES',
    'ATTACH_FILES',
    'READ_MESSAGE_HISTORY',
    'MENTION_EVERYONE'
);
const morePerms = new DiscordPermissions(
    'KICK_MEMBERS',
    'BAN_MEMBERS',
    'ADMINISTRATOR',
    'MANAGE_CHANNELS',
    'MANAGE_GUILD',
    'STREAM',
    'SEND_TTS_MESSAGES',
    'EMBED_LINKS',
    'MENTION_EVERYONE',
    'CONNECT',
    'SPEAK'
);

await runSubtagTests({
    subtag: new RoleCreateSubtag(features.instance),
    argCountBounds: { min: 1, max: 5 },
    names: ['roleCreate'],
    otherSubtags: [reasonSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptSubtagMock(reasonSubtag, { type: ReasonSubtag });
    },
    postSetup(bbctx) {
        reasonSubtag.setup(m => m.get(bbctx)).resolves('@command.user');
    },
    cases: [
        {
            code: '{rolecreate;My role name}',
            expected: '982374624329846',
            setup(ctx) {
                const guildId = ctx.guildId;
                const roleIds = ['3298746326924'];
                const adminId = snowflake.create().toString();
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup((m, $) => m.createRole($({
                    guildId,
                    name: 'My role name',
                    color: 0,
                    permissions: DiscordPermissions.NONE,
                    mentionable: false,
                    hoist: false,
                    auditReason: '@command.user'
                }))).resolves({ success: true, roleId: '982374624329846' });
            }
        },
        {
            code: '{rolecreate;My role name;red}',
            expected: '982374624329846',
            setup(ctx) {
                const guildId = ctx.guildId;
                const roleIds = ['3298746326924'];
                const adminId = snowflake.create().toString();
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup((m, $) => m.createRole($({
                    guildId,
                    name: 'My role name',
                    color: 0xff0000,
                    permissions: DiscordPermissions.NONE,
                    mentionable: false,
                    hoist: false,
                    auditReason: '@command.user'
                }))).resolves({ success: true, roleId: '982374624329846' });
            }
        },
        {
            code: `{rolecreate;My role name;;${manyPerms.raw}}`,
            expected: '982374624329846',
            setup(ctx) {
                const guildId = ctx.guildId;
                const roleIds = ['3298746326924'];
                const adminId = snowflake.create().toString();
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup((m, $) => m.createRole($({
                    guildId,
                    name: 'My role name',
                    color: 0,
                    permissions: manyPerms,
                    mentionable: false,
                    hoist: false,
                    auditReason: '@command.user'
                }))).resolves({ success: true, roleId: '982374624329846' });
            }
        },
        {
            title: 'User has admin',
            code: `{rolecreate;My role name;blue;${manyPerms.raw}}`,
            expected: '982374624329846',
            setup(ctx) {
                const guildId = ctx.guildId;
                const roleIds = ['3298746326924'];
                const adminId = snowflake.create().toString();
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup((m, $) => m.createRole($({
                    guildId,
                    name: 'My role name',
                    color: 0x0000ff,
                    permissions: manyPerms,
                    mentionable: false,
                    hoist: false,
                    auditReason: '@command.user'
                }))).resolves({ success: true, roleId: '982374624329846' });
            }
        },
        {
            title: 'User has individual permissions',
            code: `{rolecreate;My role name;blue;${manyPerms.raw}}`,
            expected: '982374624329846',
            setup(ctx) {
                const guildId = ctx.guildId;
                const roleIds = ['3298746326924'];
                const adminId = snowflake.create().toString();
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.ADMINISTRATOR.not()).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup((m, $) => m.createRole($({
                    guildId,
                    name: 'My role name',
                    color: 0x0000ff,
                    permissions: manyPerms,
                    mentionable: false,
                    hoist: false,
                    auditReason: '@command.user'
                }))).resolves({ success: true, roleId: '982374624329846' });
            }
        },
        {
            code: '{rolecreate;My role name;;;true}',
            expected: '982374624329846',
            setup(ctx) {
                const guildId = ctx.guildId;
                const roleIds = ['3298746326924'];
                const adminId = snowflake.create().toString();
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup((m, $) => m.createRole($({
                    guildId,
                    name: 'My role name',
                    color: 0,
                    permissions: DiscordPermissions.NONE,
                    mentionable: true,
                    hoist: false,
                    auditReason: '@command.user'
                }))).resolves({ success: true, roleId: '982374624329846' });
            }
        },
        {
            code: '{rolecreate;My role name;;;false}',
            expected: '982374624329846',
            setup(ctx) {
                const guildId = ctx.guildId;
                const roleIds = ['3298746326924'];
                const adminId = snowflake.create().toString();
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup((m, $) => m.createRole($({
                    guildId,
                    name: 'My role name',
                    color: 0,
                    permissions: DiscordPermissions.NONE,
                    mentionable: false,
                    hoist: false,
                    auditReason: '@command.user'
                }))).resolves({ success: true, roleId: '982374624329846' });
            }
        },
        {
            code: '{rolecreate;My role name;;;;true}',
            expected: '982374624329846',
            setup(ctx) {
                const guildId = ctx.guildId;
                const roleIds = ['3298746326924'];
                const adminId = snowflake.create().toString();
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup((m, $) => m.createRole($({
                    guildId,
                    name: 'My role name',
                    color: 0,
                    permissions: DiscordPermissions.NONE,
                    mentionable: false,
                    hoist: true,
                    auditReason: '@command.user'
                }))).resolves({ success: true, roleId: '982374624329846' });
            }
        },
        {
            code: '{rolecreate;My role name;;;;false}',
            expected: '982374624329846',
            setup(ctx) {
                const guildId = ctx.guildId;
                const roleIds = ['3298746326924'];
                const adminId = snowflake.create().toString();
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup((m, $) => m.createRole($({
                    guildId,
                    name: 'My role name',
                    color: 0,
                    permissions: DiscordPermissions.NONE,
                    mentionable: false,
                    hoist: false,
                    auditReason: '@command.user'
                }))).resolves({ success: true, roleId: '982374624329846' });
            }
        },
        {
            code: `{rolecreate;My role name;red;${morePerms.raw};true;true}`,
            expected: '982374624329846',
            setup(ctx) {
                const guildId = ctx.guildId;
                const roleIds = ['3298746326924'];
                const adminId = snowflake.create().toString();
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup((m, $) => m.createRole($({
                    guildId,
                    name: 'My role name',
                    color: 0xff0000,
                    permissions: morePerms,
                    mentionable: true,
                    hoist: true,
                    auditReason: '@command.user'
                }))).resolves({ success: true, roleId: '982374624329846' });
            }
        },
        {
            code: `{rolecreate;My role name;red;${morePerms.raw};true;true}`,
            expected: '`Author cannot create roles`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot create roles') }
            ],
            setup(ctx) {
                const guildId = ctx.guildId;
                const roleIds = ['3298746326924'];
                const adminId = snowflake.create().toString();
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.NONE).mustHappen(1);
            }
        },
        {
            code: '{rolecreate;My role name;red;abc;true;true}',
            expected: '`Permission not a number`',
            errors: [
                { error: new BBTagRuntimeError('Permission not a number', '"abc" is not a number') }
            ],
            setup(ctx) {
                const guildId = ctx.guildId;
                const roleIds = ['3298746326924'];
                const adminId = snowflake.create().toString();
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
            }
        },
        {
            code: `{rolecreate;My role name;red;${morePerms.raw};true;true}`,
            expected: '`Author missing requested permissions`',
            errors: [
                { error: new BBTagRuntimeError('Author missing requested permissions') }
            ],
            setup(ctx) {
                const guildId = ctx.guildId;
                const roleIds = ['3298746326924'];
                const adminId = snowflake.create().toString();
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.ADMINISTRATOR.not()).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.SPEAK.not()).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
            }
        },
        {
            code: `{rolecreate;My role name;red;${morePerms.raw};true;true}`,
            expected: '`Failed to create role: no perms`',
            errors: [
                { error: new BBTagRuntimeError('Failed to create role: no perms', 'Test REST error') }
            ],
            setup(ctx) {
                const guildId = ctx.guildId;
                const roleIds = ['3298746326924'];
                const adminId = snowflake.create().toString();
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup((m, $) => m.createRole($({
                    guildId,
                    name: 'My role name',
                    color: 0xff0000,
                    permissions: morePerms,
                    mentionable: true,
                    hoist: true,
                    auditReason: '@command.user'
                }))).resolves({ success: false, reason: 'Test REST error' });
            }
        },
        {
            code: `{rolecreate;My role name;red;${morePerms.raw};true;true}`,
            expected: '`Failed to create role: no perms`',
            errors: [
                { error: new BBTagRuntimeError('Failed to create role: no perms', 'Some other error message') }
            ],
            setup(ctx) {
                const guildId = ctx.guildId;
                const roleIds = ['3298746326924'];
                const adminId = snowflake.create().toString();
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.ADMINISTRATOR).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup((m, $) => m.createRole($({
                    guildId,
                    name: 'My role name',
                    color: 0xff0000,
                    permissions: morePerms,
                    mentionable: true,
                    hoist: true,
                    auditReason: '@command.user'
                }))).resolves({ success: false, reason: 'Some other error message' });
            }
        }
    ]
});
