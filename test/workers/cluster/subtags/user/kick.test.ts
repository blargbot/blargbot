import { BBTagRuntimeError, NotEnoughArgumentsError, TooManyArgumentsError, UserNotFoundError } from '@cluster/bbtag/errors';
import { ModerationManager } from '@cluster/managers';
import { KickSubtag } from '@cluster/subtags/user/kick';
import { snowflake } from '@cluster/utils';
import { ApiError, Constants } from 'eris';

import { MarkerError, runSubtagTests, SubtagTestContext } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new KickSubtag(),
    setup(ctx) {
        ctx.cluster.setup(m => m.moderation).thenReturn(new ModerationManager(ctx.cluster.instance));
    },
    cases: [
        {
            code: '{kick}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 6, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        {
            code: '{kick;abc}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 10, error: new UserNotFoundError('abc') }
            ]
        },
        {
            code: '{kick;other user}',
            expected: 'Success',
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                ctx.roles.other.position = 8;

                ctx.discord.setup(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Command User#0000] Tag Kick')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Command User#0000] Tag Kick')).once();
            }
        },
        {
            title: 'Bot is below command user',
            code: '{kick;other user}',
            expected: 'Success',
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.position = 9;
                ctx.roles.command.position = 10;
                ctx.roles.other.position = 8;

                ctx.discord.setup(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Command User#0000] Tag Kick')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Command User#0000] Tag Kick')).once();
            }
        },
        {
            title: 'Bot is an admin',
            code: '{kick;other user}',
            expected: 'Success',
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.administrator.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                ctx.roles.other.position = 8;

                ctx.discord.setup(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Command User#0000] Tag Kick')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Command User#0000] Tag Kick')).once();
            }
        },
        {
            title: 'User is an admin',
            code: '{kick;other user}',
            expected: 'Success',
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.administrator.toString();
                ctx.roles.bot.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                ctx.roles.other.position = 8;

                ctx.discord.setup(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Command User#0000] Tag Kick')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Command User#0000] Tag Kick')).once();
            }
        },
        {
            title: 'User is owner',
            code: '{kick;other user}',
            expected: 'Success',
            setup(ctx) {
                ctx.message.author = ctx.users.owner;
                ctx.message.member = ctx.members.owner;
                ctx.roles.bot.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.other.position = 8;

                ctx.discord.setup(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Guild owner#0000] Tag Kick')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Guild owner#0000] Tag Kick')).once();
            }
        },
        {
            title: 'User has kickoverride permission',
            code: '{kick;other user}',
            expected: 'Success',
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.sendMessages.toString();
                ctx.roles.bot.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                ctx.roles.other.position = 8;

                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'kickoverride')).thenResolve(Constants.Permissions.sendMessages.toString());
                ctx.discord.setup(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Command User#0000] Tag Kick')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Command User#0000] Tag Kick')).once();
            }
        },
        {
            title: 'Bot is not above target',
            code: '{kick;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to kick Other user!') }
            ],
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.position = 8;
                ctx.roles.command.position = 9;
                ctx.roles.other.position = 8;
            }
        },
        {
            title: 'Bot doesnt have KICK_MEMBERS permission',
            code: '{kick;other user}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to kick users!') }
            ],
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.permissions = '0';
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                ctx.roles.other.position = 8;
            }
        },
        {
            title: 'User isnt on the guild?',
            code: '{kick;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to kick users!') }
            ],
            setup(ctx) {
                ctx.message.author = SubtagTestContext.createApiUser({ id: snowflake.create().toString() });
                ctx.message.member = undefined;
                ctx.roles.bot.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.other.position = 8;

                const error = ctx.createRESTError(ApiError.UNKNOWN_USER);
                ctx.logger.setup(m => m.error(error)).thenReturn();
                ctx.discord.setup(m => m.getRESTGuildMember(ctx.guild.id, ctx.message.author.id))
                    .thenReject(error);
            }
        },
        {
            title: 'User is not above target',
            code: '{kick;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to kick Other user!') }
            ],
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 8;
                ctx.roles.other.position = 8;

                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'kickoverride')).thenResolve('8');
            }
        },
        {
            title: 'User doesnt have KICK_MEMBERS permission',
            code: '{kick;other user}',
            expected: '`User has no permissions`',
            errors: [
                { start: 0, end: 17, error: new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to kick users!') }
            ],
            setup(ctx) {
                ctx.roles.command.permissions = '0';
                ctx.roles.bot.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                ctx.roles.other.position = 8;

                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'kickoverride')).thenResolve('8');
            }
        },
        {
            code: '{kick;other user;My reason here}',
            expected: 'Success',
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                ctx.roles.other.position = 8;

                ctx.discord.setup(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Command User#0000] My reason here')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Command User#0000] My reason here')).once();
            }
        },
        {
            code: '{kick;other user;;true}',
            expected: 'Success',
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                ctx.roles.other.position = 8;

                ctx.discord.setup(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Command User#0000] Tag Kick')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Command User#0000] Tag Kick')).once();
            }
        },
        {
            title: 'Bot is below command user',
            code: '{kick;other user;;true}',
            expected: 'Success',
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.position = 9;
                ctx.roles.command.position = 10;
                ctx.roles.other.position = 8;

                ctx.discord.setup(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Command User#0000] Tag Kick')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Command User#0000] Tag Kick')).once();
            }
        },
        {
            title: 'Bot is an admin',
            code: '{kick;other user;;true}',
            expected: 'Success',
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.administrator.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                ctx.roles.other.position = 8;

                ctx.discord.setup(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Command User#0000] Tag Kick')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Command User#0000] Tag Kick')).once();
            }
        },
        {
            title: 'User is an admin',
            code: '{kick;other user;;true}',
            expected: 'Success',
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.administrator.toString();
                ctx.roles.bot.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                ctx.roles.other.position = 8;

                ctx.discord.setup(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Command User#0000] Tag Kick')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Command User#0000] Tag Kick')).once();
            }
        },
        {
            title: 'User is owner',
            code: '{kick;other user;;true}',
            expected: 'Success',
            setup(ctx) {
                ctx.message.author = ctx.users.owner;
                ctx.message.member = ctx.members.owner;
                ctx.roles.bot.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.other.position = 8;

                ctx.discord.setup(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Guild owner#0000] Tag Kick')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Guild owner#0000] Tag Kick')).once();
            }
        },
        {
            title: 'User doesnt have permission',
            code: '{kick;other user;;true}',
            expected: 'Success',
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.sendMessages.toString();
                ctx.roles.bot.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                ctx.roles.other.position = 8;

                ctx.discord.setup(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Command User#0000] Tag Kick')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Command User#0000] Tag Kick')).once();
            }
        },
        {
            title: 'Bot is not above target',
            code: '{kick;other user;;true}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to kick Other user!') }
            ],
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.position = 8;
                ctx.roles.command.position = 9;
                ctx.roles.other.position = 8;
            }
        },
        {
            title: 'Bot doesnt have KICK_MEMBERS permission',
            code: '{kick;other user;;true}',
            expected: '`Bot has no permissions`',
            errors: [
                { start: 0, end: 23, error: new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to kick users!') }
            ],
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.permissions = '0';
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                ctx.roles.other.position = 8;
            }
        },
        {
            title: 'User isnt on the guild?',
            code: '{kick;other user;;true}',
            expected: 'Success',
            setup(ctx) {
                ctx.message.author = SubtagTestContext.createApiUser({ id: snowflake.create().toString() });
                ctx.message.member = undefined;
                ctx.roles.bot.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.other.position = 8;

                ctx.discord.setup(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Test User#0000] Tag Kick')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Test User#0000] Tag Kick')).once();
            }
        },
        {
            title: 'User is not above target',
            code: '{kick;other user;;true}',
            expected: 'Success',
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 8;
                ctx.roles.other.position = 8;

                ctx.discord.setup(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Command User#0000] Tag Kick')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Command User#0000] Tag Kick')).once();
            }
        },
        {
            title: 'User doesnt have KICK_MEMBERS permission',
            code: '{kick;other user;;true}',
            expected: 'Success',
            setup(ctx) {
                ctx.roles.command.permissions = '0';
                ctx.roles.bot.permissions = Constants.Permissions.kickMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                ctx.roles.other.position = 8;

                ctx.discord.setup(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Command User#0000] Tag Kick')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.kickGuildMember(ctx.guild.id, ctx.users.other.id, '[Command User#0000] Tag Kick')).once();
            }
        },
        {
            code: '{kick;{eval};{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 6, end: 12, error: new MarkerError('eval', 6) },
                { start: 13, end: 19, error: new MarkerError('eval', 13) },
                { start: 20, end: 26, error: new MarkerError('eval', 20) },
                { start: 27, end: 33, error: new MarkerError('eval', 27) },
                { start: 0, end: 34, error: new TooManyArgumentsError(3, 4) }
            ]
        }
    ]
});
