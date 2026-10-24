import type { Variables, VariablesProvider } from '@blargbot/bbtag';
import { BBTagRuntimeError, NotAnArrayError, RoleNotFoundError } from '@blargbot/bbtag';
import { UserSetRolesSubtag } from '@blargbot/bbtag/subtags';
import type { Logger } from '@blargbot/logger';
import { Mock } from '@blargbot/test-util';
import * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

const logger = new Mock<Logger>({ id: 'logger' });
const variablesProvider = new Mock<VariablesProvider>({ id: 'variablesProvider' });
variablesProvider.setup(m => m.kinds).returns([]);
const variables = new Mock<Variables>({ id: 'variables' });

await runSubtagTests({
    subtag: new UserSetRolesSubtag({
        logger: logger.instance,
        variables: variablesProvider.instance
    }),
    argCountBounds: { min: 0, max: 3 },
    names: ['userSetRoles', 'setRoles'],
    setup(ctx) {
        ctx.adoptMock(logger);
        ctx.adoptMock(variablesProvider);
        ctx.adoptMock(variables);
        ctx.roles.authorizer.permissions = eris.Constants.Permissions.manageRoles.toString();
        ctx.members.authorizer.roles.push(ctx.roles.top.id);
    },
    postSetup(bbctx) {
        variablesProvider.setup(m => m.forContext(bbctx)).returns(variables.instance);
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
                        const otherRole = bbctx.root.message.channel.guild.roles.get(ctx.roles.other.id);
                        const botRole = bbctx.root.message.channel.guild.roles.get(ctx.roles.bot.id);
                        if (otherRole === undefined || botRole === undefined)
                            throw new Error('Unable to locate roles under test');

                        ctx.util.setup(m => m.findRoles(bbctx.root.message.channel.guild, '283674284762348926')).resolves([otherRole]);
                        ctx.util.setup(m => m.findRoles(bbctx.root.message.channel.guild, '234967249876489624')).resolves([botRole]);
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
                { error: new BBTagRuntimeError('Author cannot remove roles') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = '0';
            }
        },
        {
            code: '{usersetroles;abc}',
            expected: '`Not an array`',
            errors: [
                { error: new NotAnArrayError('abc') }
            ],
            setup() {
                variables.setup(m => m.get('abc')).resolves({ key: 'foo', value: undefined }).mustHappen(1);
            }
        },
        {
            code: '{usersetroles;abc;;q}',
            expected: 'false',
            errors: [
                { error: new NotAnArrayError('abc').withDisplay('false') }
            ],
            setup() {
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
                ctx.util.setup(m => m.findRoles(bbctx.root.message.channel.guild, 'unknown role')).resolves([]);
            }
        }
    ]
});
