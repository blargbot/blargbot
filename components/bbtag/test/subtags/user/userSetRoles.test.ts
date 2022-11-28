import { BBTagRuntimeError, NotAnArrayError, RoleNotFoundError } from '@blargbot/bbtag/errors';
import { UserSetRolesSubtag } from '@blargbot/bbtag/subtags/user/userSetRoles';
import { argument } from '@blargbot/test-util/mock';
import Eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new UserSetRolesSubtag(),
    argCountBounds: { min: 0, max: 3 },
    setup(ctx) {
        ctx.roles.authorizer.permissions = Eris.Constants.Permissions.manageRoles.toString();
        ctx.members.authorizer.roles.push(ctx.roles.top.id);
    },
    cases: [
        {
            code: '{usersetroles}',
            expected: 'true',
            setup(ctx) {
                ctx.discord.setup(m => m.editGuildMember(ctx.guild.id, ctx.users.command.id, argument.isDeepEqual({ roles: [] }), 'Command User#0000'))
                    .thenResolve(ctx.createGuildMember(undefined, ctx.members.command, ctx.users.command));
            }
        },
        ...createGetUserPropTestCases({
            quiet: 'false',
            generateCode(...args) {
                return `{${['usersetroles', '[]', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'true',
                    postSetup(member, _, ctx) {
                        ctx.discord.setup(m => m.editGuildMember(ctx.guild.id, member.user.id, argument.isDeepEqual({ roles: [] }), 'Command User#0000'))
                            .thenResolve(member);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases({
            quiet: 'false',
            generateCode(...args) {
                return `{${['usersetroles', '["283674284762348926","234967249876489624"]', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'true',
                    setup(_, ctx) {
                        ctx.roles.other.id = '283674284762348926';
                        ctx.roles.bot.id = '234967249876489624';
                    },
                    postSetup(member, bbctx, ctx) {
                        const otherRole = bbctx.guild.roles.get(ctx.roles.other.id);
                        const botRole = bbctx.guild.roles.get(ctx.roles.bot.id);
                        if (otherRole === undefined || botRole === undefined)
                            throw new Error('Unable to locate roles under test');

                        ctx.util.setup(m => m.findRoles(bbctx.guild, '283674284762348926')).thenResolve([otherRole]);
                        ctx.util.setup(m => m.findRoles(bbctx.guild, '234967249876489624')).thenResolve([botRole]);
                        ctx.discord.setup(m => m.editGuildMember(ctx.guild.id, member.user.id, argument.isDeepEqual({ roles: ['283674284762348926', '234967249876489624'] }), 'Command User#0000'))
                            .thenResolve(member);
                    }
                }
            ]
        }),
        {
            code: '{usersetroles}',
            expected: '`Author cannot remove roles`',
            errors: [
                { start: 0, end: 14, error: new BBTagRuntimeError('Author cannot remove roles') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = '0';
            }
        },
        {
            code: '{usersetroles;abc}',
            expected: '`Not an array`',
            errors: [
                { start: 0, end: 18, error: new NotAnArrayError('abc') }
            ]
        },
        {
            code: '{usersetroles;abc;;q}',
            expected: 'false',
            errors: [
                { start: 0, end: 21, error: new NotAnArrayError('abc').withDisplay('false') }
            ]
        },
        {
            code: '{usersetroles;["unknown role"]}',
            expected: '`No role found`',
            errors: [
                { start: 0, end: 31, error: new RoleNotFoundError('unknown role') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findRoles(bbctx.guild, 'unknown role')).thenResolve([]);
            }
        },
        {
            code: '{usersetroles;["unknown role"];;q}',
            expected: 'false',
            errors: [
                { start: 0, end: 34, error: new RoleNotFoundError('unknown role').withDisplay('false') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findRoles(bbctx.guild, 'unknown role')).thenResolve([]);
            }
        }
    ]
});
