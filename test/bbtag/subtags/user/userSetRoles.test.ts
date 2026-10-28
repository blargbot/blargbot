import type { Variables, VariablesProvider } from '@blargbot/bbtag';
import { BBTagRuntimeError, DiscordPermissions, NotAnArrayError, RoleNotFoundError } from '@blargbot/bbtag';
import type { GetMemberPermissionsFeature, ListGuildRolesFeature, ListMemberRolesFeature, VariablesFeature } from '@blargbot/bbtag/subtags';
import { ReasonSubtag, RoleIdSubtag, UserIdSubtag, UserSetRolesSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import type { SetMemberRolesFeature } from '../../../../src/bbtag/subtags/user/userSetRoles.js';
import { createSnowflake } from '../../snowflake.js';
import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

const features = new Mock<SetMemberRolesFeature & ListMemberRolesFeature & ListGuildRolesFeature & GetMemberPermissionsFeature & VariablesFeature>({ id: 'features' });
const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });
const userIdSubtag = new Mock<UserIdSubtag>({ id: 'UserIdSubtag' });
const roleIdSubtag = new Mock<RoleIdSubtag>({ id: 'RoleIdSubtag' });
const reasonSubtag = new Mock<ReasonSubtag>({ id: 'ReasonSubtag' });

await runSubtagTests({
    subtag: new UserSetRolesSubtag(features.instance),
    argCountBounds: { min: 0, max: 3 },
    names: ['userSetRoles', 'setRoles'],
    otherSubtags: [roleIdSubtag.instance, reasonSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
        ctx.adoptSubtagMock(userIdSubtag, { type: UserIdSubtag });
        ctx.adoptSubtagMock(roleIdSubtag, { type: RoleIdSubtag });
        ctx.adoptSubtagMock(reasonSubtag, { type: ReasonSubtag });
        features.setup(m => m.variables).returns(variablesProvider.instance);
    },
    postSetup(bbctx) {
        reasonSubtag.setup(m => m.get(bbctx)).resolves('@command.user');
        variablesProvider.setup(m => m.forContext(bbctx)).returns(variables.instance);
    },
    cases: [
        {
            code: '{usersetroles}',
            expected: 'true',
            subtags: [userIdSubtag.instance],
            postSetup(bbctx, ctx) {
                const guildId = ctx.guildId;
                const adminId = createSnowflake();
                const userId = ctx.userId;
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
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
                    auditReason: '@command.user'
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
            cases: [
                {
                    expected: 'true',
                    setup(userId, ctx) {
                        features.setup((m, $) => m.setMemberRoles($({
                            guildId: ctx.guildId,
                            targetId: userId,
                            roleIds: [],
                            auditReason: '@command.user'
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
                const guildId = ctx.guildId;
                const roleIds = ['283674284762348926', '234967249876489624'];
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
                    expected: 'true',
                    postSetup(userId, bbctx, ctx, quiet) {
                        const roleIds = ['283674284762348926', '234967249876489624'];
                        for (const roleId of roleIds)
                            roleIdSubtag.setup((m, $) => m.query(bbctx, roleId, $({ noLookup: quiet }))).resolves(roleId).mustHappen(1);
                        features.setup((m, $) => m.setMemberRoles($({
                            guildId: ctx.guildId,
                            targetId: userId,
                            roleIds: roleIds,
                            auditReason: '@command.user'
                        }))).resolves({ success: true }).mustHappen(1);
                    }
                }
            ]
        }),
        {
            code: '{usersetroles}',
            expected: '`Author cannot remove roles`',
            subtags: [userIdSubtag.instance],
            errors: [
                { error: new BBTagRuntimeError('Author cannot remove roles') }
            ],
            setup(ctx) {
                const guildId = ctx.guildId;
                const adminId = createSnowflake();
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.NONE).mustHappen(1);
            }
        },
        {
            code: '{usersetroles;abc}',
            expected: '`Not an array`',
            subtags: [userIdSubtag.instance],
            errors: [
                { error: new NotAnArrayError('abc') }
            ],
            postSetup(bbctx, ctx) {
                const guildId = ctx.guildId;
                const adminId = createSnowflake();
                const userId = ctx.userId;
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
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
            subtags: [userIdSubtag.instance],
            errors: [
                { error: new NotAnArrayError('abc').withDisplay('false') }
            ],
            postSetup(bbctx, ctx) {
                const guildId = ctx.guildId;
                const adminId = createSnowflake();
                const userId = ctx.userId;
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
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
            subtags: [userIdSubtag.instance],
            errors: [
                { error: new RoleNotFoundError('unknown role') }
            ],
            postSetup(bbctx, ctx) {
                const guildId = ctx.guildId;
                const adminId = createSnowflake();
                const userId = ctx.userId;
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, userId, $({ noLookup: false })))
                    .resolves(userId)
                    .mustHappen(1);
                roleIdSubtag.setup((m, $) => m.query(bbctx, 'unknown role', $({ noLookup: false }))).resolves(undefined).mustHappen(1);
            }
        },
        {
            code: '{usersetroles;["unknown role"];;q}',
            expected: 'false',
            subtags: [userIdSubtag.instance],
            errors: [
                { error: new RoleNotFoundError('unknown role').withDisplay('false') }
            ],
            postSetup(bbctx, ctx) {
                const guildId = ctx.guildId;
                const adminId = createSnowflake();
                const userId = ctx.userId;
                const botId = ctx.botId;
                const modId = ctx.authorizerId;
                features.setup(m => m.listGuildRoles(guildId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, botId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, botId)).resolves([guildId, adminId]).mustHappen(1);
                features.setup(m => m.getMemberPermissions(guildId, modId)).resolves(DiscordPermissions.MANAGE_ROLES).mustHappen(1);
                features.setup(m => m.listMemberRoles(guildId, modId)).resolves([guildId, adminId]).mustHappen(1);
                userIdSubtag.setup((m, $) => m.query(bbctx, '', $({ noLookup: true })))
                    .resolves(userId)
                    .mustHappen(1);
                roleIdSubtag.setup((m, $) => m.query(bbctx, 'unknown role', $({ noLookup: true }))).resolves(undefined).mustHappen(1);
            }
        }
    ]
});
