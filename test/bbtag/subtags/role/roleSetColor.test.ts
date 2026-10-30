import { BBTagRuntimeError, DiscordPermissions } from '@blargbot/bbtag-engine';
import type { EditRoleFeature, GetMemberPermissionsFeature, ListGuildRolesFeature, ListMemberRolesFeature } from '@blargbot/bbtag-engine/subtags';
import { ReasonSubtag, RoleIdSubtag, RoleSetColorSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { createSnowflake } from '../../snowflake.js';
import { createMockSubtag, runSubtagTests } from '../SubtagTestSuite.js';
import { createGetRolePropTestCases } from './_getRolePropTest.js';

const features = new Mock<EditRoleFeature & GetMemberPermissionsFeature & ListGuildRolesFeature & ListMemberRolesFeature>({ id: 'features' });
const roleIdSubtag = createMockSubtag(RoleIdSubtag);
const reasonSubtag = createMockSubtag(ReasonSubtag);

await runSubtagTests({
    subtag: new RoleSetColorSubtag(features.instance),
    argCountBounds: { min: 1, max: 3 },
    names: ['roleSetColor'],
    otherSubtags: [reasonSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(roleIdSubtag);
        ctx.adoptMock(reasonSubtag);
        reasonSubtag.setup(m => m.get(ctx.bbtag)).resolves('@command.user');
    },
    cases: [
        ...createGetRolePropTestCases({
            quiet: false,
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['rolesetcolor', ...args].join(';')}}`;
            },
            notFound: () => new BBTagRuntimeError('Role not found'),
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
                        features.setup((m, $) => m.editRole($({
                            guildId: ctx.guildId,
                            roleId,
                            color: 0,
                            auditReason: '@command.user'
                        }))).resolves({ success: true }).mustHappen(1);
                    }
                }
            ]
        }),
        ...[
            { text: '', color: 0x000000 },
            { text: 'this isnt a valid color', color: 0 },
            { text: 'red', color: 0xff0000 },
            { text: 'green', color: 0x008001 },
            { text: 'blue', color: 0x0000ff }
        ].flatMap(({ text, color }) => createGetRolePropTestCases({
            queryOptions: noLookup => ({ noLookup }),
            generateCode(role, ...args) {
                return `{${['rolesetcolor', role, text, ...args].join(';')}}`;
            },
            notFound: () => new BBTagRuntimeError('Role not found'),
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
                        features.setup((m, $) => m.editRole($({
                            guildId: ctx.guildId,
                            roleId,
                            color,
                            auditReason: '@command.user'
                        }))).resolves({ success: true }).mustHappen(1);
                    }
                }
            ]
        })),
        {
            code: '{rolesetcolor;3298746326924}',
            expected: '`Author cannot edit roles`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot edit roles') }
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
            code: '{rolesetcolor;3298746326924}',
            expected: '`Role above author`',
            subtags: [roleIdSubtag.instance],
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
                roleIdSubtag.setup((m, $) => m.query(ctx.bbtag, '3298746326924', $({ noLookup: false })))
                    .resolves('3298746326924')
                    .mustHappen(1);
            }
        },
        {
            code: '{rolesetcolor;3298746326924}',
            expected: '`Failed to edit role: no perms`',
            subtags: [roleIdSubtag.instance],
            errors: [
                { error: new BBTagRuntimeError('Failed to edit role: no perms', 'Test REST error') }
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
                roleIdSubtag.setup((m, $) => m.query(ctx.bbtag, '3298746326924', $({ noLookup: false })))
                    .resolves('3298746326924')
                    .mustHappen(1);
                features.setup((m, $) => m.editRole($({
                    guildId: ctx.guildId,
                    roleId: roleIds[0],
                    color: 0,
                    auditReason: '@command.user'
                }))).resolves({ success: false, reason: 'Test REST error' }).mustHappen(1);
            }
        },
        {
            code: '{rolesetcolor;3298746326924}',
            expected: '`Failed to edit role: no perms`',
            subtags: [roleIdSubtag.instance],
            errors: [
                { error: new BBTagRuntimeError('Failed to edit role: no perms', 'Some other error message') }
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
                roleIdSubtag.setup((m, $) => m.query(ctx.bbtag, '3298746326924', $({ noLookup: false })))
                    .resolves('3298746326924')
                    .mustHappen(1);
                features.setup((m, $) => m.editRole($({
                    guildId: ctx.guildId,
                    roleId: roleIds[0],
                    color: 0,
                    auditReason: '@command.user'
                }))).resolves({ success: false, reason: 'Some other error message' }).mustHappen(1);
            }
        }
    ]
});
