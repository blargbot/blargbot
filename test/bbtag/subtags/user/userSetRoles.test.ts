import { BBTagRuntimeError, NotAnArrayError, RoleNotFoundError } from '@blargbot/bbtag';
import { UserSetRolesSubtag } from '@blargbot/bbtag/subtags';
import type { Logger } from '@blargbot/logger';
import { Mock } from '@blargbot/test-util';
import * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

const logger = new Mock<Logger>({ id: 'logger' });

await runSubtagTests({
    subtag: new UserSetRolesSubtag({
        logger: logger.instance
    }),
    argCountBounds: { min: 0, max: 3 },
    names: ['userSetRoles', 'setRoles'],
    setup(ctx) {
        ctx.addMock(logger);
        logger.reset();
        ctx.roles.authorizer.permissions = eris.Constants.Permissions.manageRoles.toString();
        ctx.members.authorizer.roles.push(ctx.roles.top.id);
    },
    cases: [
        {
            code: '{usersetroles}',
            expected: 'true',
            setup(ctx) {
                ctx.discord.setup((m, $) => m.editGuildMember(ctx.guild.id, ctx.users.command.id, $({ roles: [] }), 'Command User#0000'))
                    .resolves(ctx.createGuildMember(undefined, ctx.members.command, ctx.users.command));
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
                        ctx.discord.setup((m, $) => m.editGuildMember(ctx.guild.id, member.user.id, $({ roles: [] }), 'Command User#0000'))
                            .resolves(member);
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
                        const otherRole = bbctx.local.message.channel.guild.roles.get(ctx.roles.other.id);
                        const botRole = bbctx.local.message.channel.guild.roles.get(ctx.roles.bot.id);
                        if (otherRole === undefined || botRole === undefined)
                            throw new Error('Unable to locate roles under test');

                        ctx.util.setup(m => m.findRoles(bbctx.local.message.channel.guild, '283674284762348926')).resolves([otherRole]);
                        ctx.util.setup(m => m.findRoles(bbctx.local.message.channel.guild, '234967249876489624')).resolves([botRole]);
                        ctx.discord.setup((m, $) => m.editGuildMember(ctx.guild.id, member.user.id, $({ roles: ['283674284762348926', '234967249876489624'] }), 'Command User#0000'))
                            .resolves(member);
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
                ctx.util.setup(m => m.findRoles(bbctx.local.message.channel.guild, 'unknown role')).resolves([]);
            }
        },
        {
            code: '{usersetroles;["unknown role"];;q}',
            expected: 'false',
            errors: [
                { start: 0, end: 34, error: new RoleNotFoundError('unknown role').withDisplay('false') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findRoles(bbctx.local.message.channel.guild, 'unknown role')).resolves([]);
            }
        }
    ]
});
