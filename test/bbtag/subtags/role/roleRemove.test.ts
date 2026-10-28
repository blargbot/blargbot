import { BBTagRuntimeError, DiscordPermissions, RoleNotFoundError, UserNotFoundError } from '@blargbot/bbtag';
import type { GetMemberPermissionsFeature, ListGuildRolesFeature, ListMemberRolesFeature, RemoveMemberRolesFeature } from '@blargbot/bbtag/subtags';
import { ReasonSubtag, RoleRemoveSubtag, UserIdSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { createSnowflake } from '../../snowflake.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<RemoveMemberRolesFeature & ListMemberRolesFeature & ListGuildRolesFeature & GetMemberPermissionsFeature>({ id: 'features' });
const userIdSubtag = new Mock<UserIdSubtag>({ id: 'UserIdSubtag' });
const reasonSubtag = new Mock<ReasonSubtag>({ id: 'ReasonSubtag' });

await runSubtagTests({
    subtag: new RoleRemoveSubtag(features.instance),
    argCountBounds: { min: 1, max: 3 },
    names: ['roleRemove', 'removeRole'],
    otherSubtags: [userIdSubtag.instance, reasonSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptSubtagMock(userIdSubtag, { type: UserIdSubtag });
        ctx.adoptSubtagMock(reasonSubtag, { type: ReasonSubtag });
    },
    postSetup(bbctx) {
        reasonSubtag.setup(m => m.get(bbctx)).resolves('@command.user');
    },
    cases: [
        {
            title: 'User has the role',
            code: '{roleremove;3298746326924}',
            expected: 'true',
            setup(ctx) {
                const guildId = ctx.guildId;
                const roleIds = ['3298746326924'];
                const adminId = createSnowflake();
                const userId = ctx.userId;
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
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
                    auditReason: '@command.user'
                }))).resolves({ success: true }).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                userIdSubtag.setup((m, $) => m.query(bbctx, ctx.userId, $({ noLookup: false })))
                    .resolves(ctx.userId)
                    .mustHappen(1);
            }
        },
        {
            title: 'User is missing the role',
            code: '{roleremove;3298746326924}',
            expected: 'false',
            setup(ctx) {
                const guildId = ctx.guildId;
                const roleIds = ['3298746326924'];
                const adminId = createSnowflake();
                const userId = ctx.userId;
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, userId)).resolves([guildId]).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                userIdSubtag.setup((m, $) => m.query(bbctx, ctx.userId, $({ noLookup: false })))
                    .resolves(ctx.userId)
                    .mustHappen(1);
            }
        },
        {
            code: '{roleremove;["3298746326924","9238476938485"]}',
            expected: 'true',
            setup(ctx) {
                const guildId = ctx.guildId;
                const roleIds = ['3298746326924', '9238476938485'];
                const adminId = createSnowflake();
                const userId = ctx.userId;
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
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
                    auditReason: '@command.user'
                }))).resolves({ success: true }).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                userIdSubtag.setup((m, $) => m.query(bbctx, ctx.userId, $({ noLookup: false })))
                    .resolves(ctx.userId)
                    .mustHappen(1);
            }
        },
        {
            code: '{roleremove;["3298746326924",null]}',
            expected: 'true',
            setup(ctx) {
                const guildId = ctx.guildId;
                const roleIds = ['3298746326924'];
                const adminId = createSnowflake();
                const userId = ctx.userId;
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
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
                    auditReason: '@command.user'
                }))).resolves({ success: true }).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                userIdSubtag.setup((m, $) => m.query(bbctx, ctx.userId, $({ noLookup: false })))
                    .resolves(ctx.userId)
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
                const guildId = ctx.guildId;
                const roleIds = ['3298746326924', '9238476938485'];
                const adminId = createSnowflake();
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
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
                const guildId = ctx.guildId;
                const roleIds = ['3298746326924'];
                const adminId = createSnowflake();
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, ...roleIds]).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                userIdSubtag.setup((m, $) => m.query(bbctx, ctx.userId, $({ noLookup: false })))
                    .resolves(ctx.userId)
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
                const guildId = ctx.guildId;
                const adminId = createSnowflake();
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                userIdSubtag.setup((m, $) => m.query(bbctx, ctx.userId, $({ noLookup: false })))
                    .resolves(ctx.userId)
                    .mustHappen(1);
            }
        },
        {
            code: '{roleremove;3298746326924;other user}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const guildId = ctx.guildId;
                const roleIds = ['3298746326924'];
                const adminId = createSnowflake();
                const userId = `otherUser<${createSnowflake()}>`;
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
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
                    auditReason: '@command.user'
                }))).resolves({ success: true }).mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, 'other user', $({ noLookup: false })))
                    .resolves(userId)
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
                const guildId = ctx.guildId;
                const roleIds = ['3298746326924'];
                const adminId = createSnowflake();
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
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
                const guildId = ctx.guildId;
                const roleIds = ['3298746326924'];
                const adminId = createSnowflake();
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
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
                const guildId = ctx.guildId;
                const roleIds = ['3298746326924'];
                const adminId = createSnowflake();
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
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
