import { BBTagRuntimeError, DiscordPermissions } from '@blargbot/bbtag';
import type { DeleteRoleFeature, GetMemberPermissionsFeature, ListGuildRolesFeature, ListMemberRolesFeature } from '@blargbot/bbtag/subtags';
import { ReasonSubtag, RoleDeleteSubtag, RoleIdSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { createSnowflake } from '../../snowflake.js';
import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

const features = new Mock<DeleteRoleFeature & GetMemberPermissionsFeature & ListGuildRolesFeature & ListMemberRolesFeature>({ id: 'features' });
const roleIdSubtag = new Mock<RoleIdSubtag>({ id: 'RoleIdSubtag' });
const reasonSubtag = new Mock<ReasonSubtag>({ id: 'ReasonSubtag' });

await runSubtagTests({
    subtag: new RoleDeleteSubtag(features.instance),
    argCountBounds: { min: 1, max: 2 },
    names: ['roleDelete'],
    otherSubtags: [reasonSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptSubtagMock(roleIdSubtag, { type: RoleIdSubtag });
        ctx.adoptSubtagMock(reasonSubtag, { type: ReasonSubtag });
    },
    postSetup(bbctx) {
        reasonSubtag.setup(m => m.get(bbctx)).resolves('@command.user');
    },
    cases: [
        ...createGetRolePropTestCases({
            quiet: '',
            queryOptions: quiet => ({ noLookup: quiet, noErrors: quiet }),
            generateCode(...args) {
                return `{${['roledelete', ...args].join(';')}}`;
            },
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
            cases: [
                {
                    expected: '',
                    setup(roleId, ctx) {
                        features.setup((m, $) => m.deleteRole($({
                            guildId: ctx.guildId,
                            roleId,
                            auditReason: '@command.user'
                        }))).resolves({ success: true }).mustHappen(1);
                    }
                }
            ]
        }),
        {
            code: '{roledelete;3298746326924}',
            expected: '`Author cannot delete roles`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot delete roles') }
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
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.NONE).mustHappen(1);
            }
        },
        {
            code: '{roledelete;3298746326924}',
            expected: '`Role above author`',
            subtags: [roleIdSubtag.instance],
            errors: [
                { error: new BBTagRuntimeError('Role above author') }
            ],
            postSetup(bbctx, ctx) {
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
                roleIdSubtag.setup((m, $) => m.query(bbctx, '3298746326924', $({ noLookup: false, noErrors: false })))
                    .resolves('3298746326924')
                    .mustHappen(1);
            }
        },
        {
            code: '{roledelete;3298746326924}',
            expected: '`Failed to delete role: no perms`',
            subtags: [roleIdSubtag.instance],
            errors: [
                { error: new BBTagRuntimeError('Failed to delete role: no perms', 'Test REST error') }
            ],
            postSetup(bbctx, ctx) {
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
                roleIdSubtag.setup((m, $) => m.query(bbctx, '3298746326924', $({ noLookup: false, noErrors: false })))
                    .resolves('3298746326924')
                    .mustHappen(1);
                features.setup((m, $) => m.deleteRole($({
                    guildId: ctx.guildId,
                    roleId: roleIds[0],
                    auditReason: '@command.user'
                }))).resolves({ success: false, reason: 'Test REST error' }).mustHappen(1);
            }
        },
        {
            code: '{roledelete;3298746326924}',
            expected: '`Failed to delete role: no perms`',
            subtags: [roleIdSubtag.instance],
            errors: [
                { error: new BBTagRuntimeError('Failed to delete role: no perms', 'Some other error message') }
            ],
            postSetup(bbctx, ctx) {
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
                roleIdSubtag.setup((m, $) => m.query(bbctx, '3298746326924', $({ noLookup: false, noErrors: false })))
                    .resolves('3298746326924')
                    .mustHappen(1);
                features.setup((m, $) => m.deleteRole($({
                    guildId: ctx.guildId,
                    roleId: roleIds[0],
                    auditReason: '@command.user'
                }))).resolves({ success: false, reason: 'Some other error message' }).mustHappen(1);
            }
        }
    ]
});
