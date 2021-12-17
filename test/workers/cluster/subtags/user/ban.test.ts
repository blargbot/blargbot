import { BBTagRuntimeError, NotANumberError, NotEnoughArgumentsError, TooManyArgumentsError, UserNotFoundError } from '@cluster/bbtag/errors';
import { ModerationManager } from '@cluster/managers';
import { BanSubtag } from '@cluster/subtags/user/ban';
import { snowflake } from '@cluster/utils';
import { APIGuildMember, APIRole } from 'discord-api-types';
import { ApiError, Constants } from 'eris';

import { argument } from '../../../../mock';
import { MarkerError, runSubtagTests, SubtagTestCase, SubtagTestContext } from '../SubtagTestSuite';

interface BanTestCase extends SubtagTestCase, ReturnType<typeof generateTestData> {

}

runSubtagTests<BanSubtag, BanTestCase>({
    subtag: new BanSubtag(),
    setup(ctx) {
        ctx.cluster.setup(m => m.moderation).thenReturn(new ModerationManager(ctx.cluster.instance));
        ctx.guild.roles.push(this.targetUserRole);
        ctx.guild.members.push(this.targetUser);
        this.targetUser.roles.push(this.targetUserRole.id);
    },
    cases: [
        {
            code: '{ban}',
            expected: '`Not enough arguments`',
            ...generateTestData(),
            errors: [
                { start: 0, end: 5, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        {
            code: '{ban;abc}',
            expected: '`No user found`',
            ...generateTestData(),
            errors: [
                { start: 0, end: 9, error: new UserNotFoundError('abc') }
            ]
        },
        {
            code: '{ban;bannable user}',
            expected: 'true',
            ...generateTestData(),
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                this.targetUserRole.position = 8;

                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id)).thenResolve([]);
                ctx.discord.setup(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] Tag Ban')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] Tag Ban')).once();
            }
        },
        {
            title: 'Bot is below command user',
            code: '{ban;bannable user}',
            expected: 'true',
            ...generateTestData(),
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.position = 9;
                ctx.roles.command.position = 10;
                this.targetUserRole.position = 8;

                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id)).thenResolve([]);
                ctx.discord.setup(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] Tag Ban')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] Tag Ban')).once();
            }
        },
        {
            title: 'Bot is an admin',
            code: '{ban;bannable user}',
            expected: 'true',
            ...generateTestData(),
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.administrator.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                this.targetUserRole.position = 8;

                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id)).thenResolve([]);
                ctx.discord.setup(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] Tag Ban')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] Tag Ban')).once();
            }
        },
        {
            title: 'User is an admin',
            code: '{ban;bannable user}',
            expected: 'true',
            ...generateTestData(),
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.administrator.toString();
                ctx.roles.bot.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                this.targetUserRole.position = 8;

                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id)).thenResolve([]);
                ctx.discord.setup(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] Tag Ban')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] Tag Ban')).once();
            }
        },
        {
            title: 'User is owner',
            code: '{ban;bannable user}',
            expected: 'true',
            ...generateTestData(),
            setup(ctx) {
                ctx.message.author = ctx.users.owner;
                ctx.message.member = ctx.members.owner;
                ctx.roles.bot.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.position = 10;
                this.targetUserRole.position = 8;

                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id)).thenResolve([]);
                ctx.discord.setup(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Guild owner#0000] Tag Ban')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Guild owner#0000] Tag Ban')).once();
            }
        },
        {
            title: 'Target is already banned',
            code: '{ban;bannable user}',
            expected: 'true',
            ...generateTestData(),
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                this.targetUserRole.position = 8;

                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id)).thenResolve([{
                    user: ctx.createUser(this.targetUser.user)
                }]);
            }
        },
        {
            title: 'User has banoverride permission',
            code: '{ban;bannable user}',
            expected: 'true',
            ...generateTestData(),
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.sendMessages.toString();
                ctx.roles.bot.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                this.targetUserRole.position = 8;

                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'banoverride')).thenResolve(Constants.Permissions.sendMessages.toString());
                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id)).thenResolve([]);
                ctx.discord.setup(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] Tag Ban')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] Tag Ban')).once();
            }
        },
        {
            title: 'Bot is not above target',
            code: '{ban;123456789123456789}',
            expected: '`Bot has no permissions`',
            ...generateTestData(),
            errors: [
                { start: 0, end: 24, error: new BBTagRuntimeError('Bot has no permissions') }
            ],
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.position = 8;
                ctx.roles.command.position = 9;
                this.targetUserRole.position = 8;
            }
        },
        {
            title: 'Bot doesnt have BAN_MEMBERS permission',
            code: '{ban;123456789123456789}',
            expected: '`Bot has no permissions`',
            ...generateTestData(),
            errors: [
                { start: 0, end: 24, error: new BBTagRuntimeError('Bot has no permissions') }
            ],
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.permissions = '0';
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                this.targetUserRole.position = 8;
            }
        },
        {
            title: 'User isnt on the guild?',
            code: '{ban;123456789123456789}',
            expected: '`User has no permissions`',
            ...generateTestData(),
            errors: [
                { start: 0, end: 24, error: new BBTagRuntimeError('User has no permissions') }
            ],
            setup(ctx) {
                ctx.message.author = SubtagTestContext.createApiUser({ id: snowflake.create().toString() });
                ctx.message.member = undefined;
                ctx.roles.bot.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.position = 10;
                this.targetUserRole.position = 8;

                const error = ctx.createRESTError(ApiError.UNKNOWN_USER);
                ctx.logger.setup(m => m.error(error)).thenReturn();
                ctx.discord.setup(m => m.getRESTGuildMember(ctx.guild.id, ctx.message.author.id))
                    .thenReject(error);
            }
        },
        {
            title: 'User is not above target',
            code: '{ban;123456789123456789}',
            expected: '`User has no permissions`',
            ...generateTestData(),
            errors: [
                { start: 0, end: 24, error: new BBTagRuntimeError('User has no permissions') }
            ],
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 8;
                this.targetUserRole.position = 8;

                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'banoverride')).thenResolve('8');
            }
        },
        {
            title: 'User doesnt have BAN_MEMBERS permission',
            code: '{ban;123456789123456789}',
            expected: '`User has no permissions`',
            ...generateTestData(),
            errors: [
                { start: 0, end: 24, error: new BBTagRuntimeError('User has no permissions') }
            ],
            setup(ctx) {
                ctx.roles.command.permissions = '0';
                ctx.roles.bot.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                this.targetUserRole.position = 8;

                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'banoverride')).thenResolve('8');
            }
        },
        {
            code: '{ban;bannable user;0}',
            expected: 'true',
            ...generateTestData(),
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                this.targetUserRole.position = 8;

                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id)).thenResolve([]);
                ctx.discord.setup(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 0, '[Command User#0000] Tag Ban')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 0, '[Command User#0000] Tag Ban')).once();
            }
        },
        {
            code: '{ban;bannable user;17}',
            expected: 'true',
            ...generateTestData(),
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                this.targetUserRole.position = 8;

                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id)).thenResolve([]);
                ctx.discord.setup(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 17, '[Command User#0000] Tag Ban')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 17, '[Command User#0000] Tag Ban')).once();
            }
        },
        {
            code: '{ban;bannable user;abc}',
            expected: 'false',
            ...generateTestData(),
            errors: [
                { start: 0, end: 23, error: new NotANumberError('abc').withDisplay('false') }
            ]
        },
        {
            code: '{ban;bannable user;;My reason here}',
            expected: 'true',
            ...generateTestData(),
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                this.targetUserRole.position = 8;

                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id)).thenResolve([]);
                ctx.discord.setup(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] My reason here')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] My reason here')).once();
            }
        },
        {
            code: '{ban;bannable user;17;My reason here}',
            expected: 'true',
            ...generateTestData(),
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                this.targetUserRole.position = 8;

                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id)).thenResolve([]);
                ctx.discord.setup(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 17, '[Command User#0000] My reason here')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 17, '[Command User#0000] My reason here')).once();
            }
        },
        {
            code: '{ban;bannable user;;;10 days}',
            expected: '864000000',
            ...generateTestData(),
            retries: 3,
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                this.targetUserRole.position = 8;

                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id)).thenResolve([]);
                ctx.discord.setup(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] Tag Ban')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
                ctx.timeouts.setup(m => m.insert('unban', argument.isDeepEqual({
                    source: ctx.guild.id,
                    guild: ctx.guild.id,
                    user: this.targetUser.user.id,
                    duration: '"P10D"',
                    endtime: argument.isTypeof('number').and(v => v - this.timestamp.add(10, 'days').valueOf() < 20)()
                }))).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] Tag Ban')).once();
                ctx.timeouts.setup(m => m.insert('unban', argument.isDeepEqual({
                    source: ctx.guild.id,
                    guild: ctx.guild.id,
                    user: this.targetUser.user.id,
                    duration: '"P10D"',
                    endtime: argument.isTypeof('number').and(v => v - this.timestamp.add(10, 'days').valueOf() < 20)()
                }))).thenResolve();
            }
        },
        {
            code: '{ban;bannable user;14;This is the reason!;10 days}',
            expected: '864000000',
            ...generateTestData(),
            retries: 3,
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                this.targetUserRole.position = 8;

                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id)).thenResolve([]);
                ctx.discord.setup(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 14, '[Command User#0000] This is the reason!')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
                ctx.timeouts.setup(m => m.insert('unban', argument.isDeepEqual({
                    source: ctx.guild.id,
                    guild: ctx.guild.id,
                    user: this.targetUser.user.id,
                    duration: '"P10D"',
                    endtime: argument.isTypeof('number').and(v => v - this.timestamp.add(10, 'days').valueOf() < 20)()
                }))).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 14, '[Command User#0000] This is the reason!')).once();
                ctx.timeouts.setup(m => m.insert('unban', argument.isDeepEqual({
                    source: ctx.guild.id,
                    guild: ctx.guild.id,
                    user: this.targetUser.user.id,
                    duration: '"P10D"',
                    endtime: argument.isTypeof('number').and(v => v - this.timestamp.add(10, 'days').valueOf() < 20)()
                }))).thenResolve();
            }
        },
        {
            code: '{ban;bannable user;;;;true}',
            expected: 'true',
            ...generateTestData(),
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                this.targetUserRole.position = 8;

                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id)).thenResolve([]);
                ctx.discord.setup(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] Tag Ban')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] Tag Ban')).once();
            }
        },
        {
            title: 'Bot is below command user',
            code: '{ban;bannable user;;;;true}',
            expected: 'true',
            ...generateTestData(),
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.position = 9;
                ctx.roles.command.position = 10;
                this.targetUserRole.position = 8;

                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id)).thenResolve([]);
                ctx.discord.setup(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] Tag Ban')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] Tag Ban')).once();
            }
        },
        {
            title: 'Bot is an admin',
            code: '{ban;bannable user;;;;true}',
            expected: 'true',
            ...generateTestData(),
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.administrator.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                this.targetUserRole.position = 8;

                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id)).thenResolve([]);
                ctx.discord.setup(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] Tag Ban')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] Tag Ban')).once();
            }
        },
        {
            title: 'User is an admin',
            code: '{ban;bannable user;;;;true}',
            expected: 'true',
            ...generateTestData(),
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.administrator.toString();
                ctx.roles.bot.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                this.targetUserRole.position = 8;

                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id)).thenResolve([]);
                ctx.discord.setup(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] Tag Ban')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] Tag Ban')).once();
            }
        },
        {
            title: 'User is owner',
            code: '{ban;bannable user;;;;true}',
            expected: 'true',
            ...generateTestData(),
            setup(ctx) {
                ctx.message.author = ctx.users.owner;
                ctx.message.member = ctx.members.owner;
                ctx.roles.bot.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.position = 10;
                this.targetUserRole.position = 8;

                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id)).thenResolve([]);
                ctx.discord.setup(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Guild owner#0000] Tag Ban')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Guild owner#0000] Tag Ban')).once();
            }
        },
        {
            title: 'Target is already banned',
            code: '{ban;bannable user;;;;true}',
            expected: 'true',
            ...generateTestData(),
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                this.targetUserRole.position = 8;

                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id)).thenResolve([{
                    user: ctx.createUser(this.targetUser.user)
                }]);
            }
        },
        {
            title: 'User doesnt have permission',
            code: '{ban;bannable user;;;;true}',
            expected: 'true',
            ...generateTestData(),
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.sendMessages.toString();
                ctx.roles.bot.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                this.targetUserRole.position = 8;

                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id)).thenResolve([]);
                ctx.discord.setup(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] Tag Ban')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] Tag Ban')).once();
            }
        },
        {
            title: 'Bot is not above target',
            code: '{ban;123456789123456789;;;;true}',
            expected: '`Bot has no permissions`',
            ...generateTestData(),
            errors: [
                { start: 0, end: 32, error: new BBTagRuntimeError('Bot has no permissions') }
            ],
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.position = 8;
                ctx.roles.command.position = 9;
                this.targetUserRole.position = 8;
            }
        },
        {
            title: 'Bot doesnt have BAN_MEMBERS permission',
            code: '{ban;123456789123456789;;;;true}',
            expected: '`Bot has no permissions`',
            ...generateTestData(),
            errors: [
                { start: 0, end: 32, error: new BBTagRuntimeError('Bot has no permissions') }
            ],
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.permissions = '0';
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                this.targetUserRole.position = 8;
            }
        },
        {
            title: 'User isnt on the guild?',
            code: '{ban;123456789123456789;;;;true}',
            expected: 'true',
            ...generateTestData(),
            setup(ctx) {
                ctx.message.author = SubtagTestContext.createApiUser({ id: snowflake.create().toString() });
                ctx.message.member = undefined;
                ctx.roles.bot.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.position = 10;
                this.targetUserRole.position = 8;

                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id)).thenResolve([]);
                ctx.discord.setup(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Test User#0000] Tag Ban')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Test User#0000] Tag Ban')).once();
            }
        },
        {
            title: 'User is not above target',
            code: '{ban;123456789123456789;;;;true}',
            expected: 'true',
            ...generateTestData(),
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 8;
                this.targetUserRole.position = 8;

                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id)).thenResolve([]);
                ctx.discord.setup(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] Tag Ban')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] Tag Ban')).once();
            }
        },
        {
            title: 'User doesnt have BAN_MEMBERS permission',
            code: '{ban;123456789123456789;;;;true}',
            expected: 'true',
            ...generateTestData(),
            setup(ctx) {
                ctx.roles.command.permissions = '0';
                ctx.roles.bot.permissions = Constants.Permissions.banMembers.toString();
                ctx.roles.bot.position = 10;
                ctx.roles.command.position = 9;
                this.targetUserRole.position = 8;

                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id)).thenResolve([]);
                ctx.discord.setup(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] Tag Ban')).thenResolve();
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.banGuildMember(ctx.guild.id, this.targetUser.user.id, 1, '[Command User#0000] Tag Ban')).once();
            }
        },
        {
            code: '{ban;{eval};{eval};{eval};{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            ...generateTestData(),
            errors: [
                { start: 5, end: 11, error: new MarkerError('eval', 5) },
                { start: 12, end: 18, error: new MarkerError('eval', 12) },
                { start: 19, end: 25, error: new MarkerError('eval', 19) },
                { start: 26, end: 32, error: new MarkerError('eval', 26) },
                { start: 33, end: 39, error: new MarkerError('eval', 33) },
                { start: 40, end: 46, error: new MarkerError('eval', 40) },
                { start: 0, end: 47, error: new TooManyArgumentsError(5, 6) }
            ]
        }
    ]
});

function generateTestData(): { targetUserRole: APIRole; targetUser: RequiredProps<APIGuildMember, 'user'>; } {
    const userRole = SubtagTestContext.createApiRole({
        id: snowflake.create().toString(),
        name: 'user'
    });

    const banUser = SubtagTestContext.createApiGuildMember({}, SubtagTestContext.createApiUser({
        id: '123456789123456789',
        username: 'bannable user',
        discriminator: '0001'
    }));

    return { targetUserRole: userRole, targetUser: banUser };
}
