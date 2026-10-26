import type { Variables, VariablesProvider } from '@blargbot/bbtag';
import { BBTagRuntimeError, DiscordPermissions, NotAnArrayError, RoleNotFoundError } from '@blargbot/bbtag';
import { type GetMemberPermissionsFeature, type ListGuildRolesFeature, type ListMemberRolesFeature, UserIdSubtag, UserSetRolesSubtag, type VariablesFeature } from '@blargbot/bbtag/subtags';
import { snowflake } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';
import * as eris from 'eris';

import type { SetMemberRolesFeature } from '../../../../src/bbtag/subtags/user/userSetRoles.js';
import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

const features = new Mock<SetMemberRolesFeature & ListMemberRolesFeature & ListGuildRolesFeature & GetMemberPermissionsFeature & VariablesFeature>({ id: 'features' });
const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });
const userIdSubtag = new Mock<UserIdSubtag>({ id: 'UserIdSubtag' });

await runSubtagTests({
    subtag: new UserSetRolesSubtag(features.instance),
    argCountBounds: { min: 0, max: 3 },
    names: ['userSetRoles', 'setRoles'],
    otherSubtags: [userIdSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
        ctx.adoptSubtagMock(userIdSubtag, { type: UserIdSubtag });
        ctx.roles.authorizer.permissions = eris.Constants.Permissions.manageRoles.toString();
        ctx.members.authorizer.roles.push(ctx.roles.top.id);
        features.setup(m => m.variables).returns(variablesProvider.instance);
    },
    postSetup(bbctx) {
        variablesProvider.setup(m => m.forContext(bbctx)).returns(variables.instance);
    },
    cases: [
        {
            code: '{usersetroles}',
            expected: 'true',
            postSetup(bbctx, ctx) {
                const guildId = ctx.guild.id;
                const adminId = snowflake.create().toString();
                const userId = ctx.users.command.id;
                const botId = ctx.users.bot.id;
                const modId = ctx.users.authorizer.id;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, userId, $({ noLookup: false })))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup((m, $) => m.setMemberRoles($({
                    guildId,
                    targetId: userId,
                    roleIds: [],
                    auditReason: 'Command User#0000'
                }))).resolves({ success: true }).mustHappen(1);
            }
        },
        ...createGetUserPropTestCases({
            quiet: 'false',
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['usersetroles', '[]', ...args].join(';')}}`;
            },
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
            cases: [
                {
                    expected: 'true',
                    setup(userId, ctx) {
                        features.setup((m, $) => m.setMemberRoles($({
                            guildId: ctx.guild.id,
                            targetId: userId,
                            roleIds: [],
                            auditReason: 'Command User#0000'
                        }))).resolves({ success: true }).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases({
            quiet: 'false',
            queryOptions: noLookup => ({ noLookup }),
            generateCode(...args) {
                return `{${['usersetroles', '["283674284762348926","234967249876489624"]', ...args].join(';')}}`;
            },
            setup(ctx) {
                const guildId = ctx.guild.id;
                const roleIds = ['283674284762348926', '234967249876489624'];
                const adminId = snowflake.create().toString();
                const botId = ctx.users.bot.id;
                const modId = ctx.users.authorizer.id;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, ...roleIds, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
            },
            cases: [
                {
                    expected: 'true',
                    postSetup(userId, bbctx, ctx) {
                        const roleIds = ['283674284762348926', '234967249876489624'];
                        for (const roleId of roleIds) {
                            const role = new Mock<eris.Role>({ id: `role<${roleId}>` });
                            role.setup(m => m.id).returns(roleId);
                            ctx.util.setup(m => m.findRoles(bbctx.root.message.channel.guild, roleId))
                                .resolves([role.instance])
                                .mustHappen(1);
                        }
                        features.setup((m, $) => m.setMemberRoles($({
                            guildId: ctx.guild.id,
                            targetId: userId,
                            roleIds: roleIds,
                            auditReason: 'Command User#0000'
                        }))).resolves({ success: true }).mustHappen(1);
                    }
                }
            ]
        }),
        {
            code: '{usersetroles}',
            expected: '`Author cannot remove roles`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot remove roles') }
            ],
            setup(ctx) {
                const guildId = ctx.guild.id;
                const adminId = snowflake.create().toString();
                const botId = ctx.users.bot.id;
                const modId = ctx.users.authorizer.id;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.NONE).mustHappen(1);
            }
        },
        {
            code: '{usersetroles;abc}',
            expected: '`Not an array`',
            errors: [
                { error: new NotAnArrayError('abc') }
            ],
            postSetup(bbctx, ctx) {
                const guildId = ctx.guild.id;
                const adminId = snowflake.create().toString();
                const userId = ctx.users.command.id;
                const botId = ctx.users.bot.id;
                const modId = ctx.users.authorizer.id;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, userId, $({ noLookup: false })))
                    .resolves(userId)
                    .mustHappen(1);
                variables.setup(m => m.get('abc')).resolves({ key: 'foo', value: undefined }).mustHappen(1);
            }
        },
        {
            code: '{usersetroles;abc;;q}',
            expected: 'false',
            errors: [
                { error: new NotAnArrayError('abc').withDisplay('false') }
            ],
            postSetup(bbctx, ctx) {
                const guildId = ctx.guild.id;
                const adminId = snowflake.create().toString();
                const userId = ctx.users.command.id;
                const botId = ctx.users.bot.id;
                const modId = ctx.users.authorizer.id;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, '', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);
                variables.setup(m => m.get('abc')).resolves({ key: 'foo', value: undefined }).mustHappen(1);
            }
        },
        {
            code: '{usersetroles;["unknown role"]}',
            expected: '`No role found`',
            errors: [
                { error: new RoleNotFoundError('unknown role') }
            ],
            postSetup(bbctx, ctx) {
                const guildId = ctx.guild.id;
                const adminId = snowflake.create().toString();
                const userId = ctx.users.command.id;
                const botId = ctx.users.bot.id;
                const modId = ctx.users.authorizer.id;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, userId, $({ noLookup: false })))
                    .resolves(userId)
                    .mustHappen(1);
                ctx.util.setup(m => m.findRoles(bbctx.root.message.channel.guild, 'unknown role')).resolves([]);
            }
        },
        {
            code: '{usersetroles;["unknown role"];;q}',
            expected: 'false',
            errors: [
                { error: new RoleNotFoundError('unknown role').withDisplay('false') }
            ],
            postSetup(bbctx, ctx) {
                const guildId = ctx.guild.id;
                const adminId = snowflake.create().toString();
                const userId = ctx.users.command.id;
                const botId = ctx.users.bot.id;
                const modId = ctx.users.authorizer.id;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, '', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);
                ctx.util.setup(m => m.findRoles(bbctx.root.message.channel.guild, 'unknown role')).resolves([]);
            }
        }
    ]
});
