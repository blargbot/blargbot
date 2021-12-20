import { NotANumberError, TooManyArgumentsError, UserNotFoundError } from '@cluster/bbtag/errors';
import { ModerationManager } from '@cluster/managers';
import { WarnSubtag } from '@cluster/subtags/user/warn';
import { Constants } from 'eris';

import { argument } from '../../../../mock';
import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new WarnSubtag(),
    setup(ctx) {
        ctx.cluster.setup(m => m.moderation).thenReturn(new ModerationManager(ctx.cluster.instance));
        ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'actonlimitsonly')).thenResolve(true);
        ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'kickat')).thenResolve(10);
        ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'banat')).thenResolve(30);
        ctx.roles.bot.permissions = (Constants.Permissions.kickMembers | Constants.Permissions.banMembers).toString();
        ctx.roles.bot.position = 10;
        ctx.roles.command.permissions = (Constants.Permissions.kickMembers | Constants.Permissions.banMembers).toString();
        ctx.roles.command.position = 9;
        ctx.roles.other.position = 8;
    },
    cases: [
        {
            code: '{warn}',
            expected: '1',
            setup(ctx) {
                ctx.guildTable.setup(m => m.getWarnings(ctx.guild.id, ctx.users.command.id)).thenResolve(undefined);
                ctx.guildTable.setup(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, 1)).thenResolve(true);
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.guildTable.verify(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, 1)).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'modlog')).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'kickat')).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'banat')).once();
            }
        },
        {
            code: '{warn}',
            expected: '5',
            setup(ctx) {
                ctx.guildTable.setup(m => m.getWarnings(ctx.guild.id, ctx.users.command.id)).thenResolve(4);
                ctx.guildTable.setup(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, 5)).thenResolve(true);
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.guildTable.verify(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, 5)).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'modlog')).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'kickat')).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'banat')).once();
            }
        },
        {
            code: '{warn}',
            expected: '10',
            setup(ctx) {
                ctx.guildTable.setup(m => m.getWarnings(ctx.guild.id, ctx.users.command.id)).thenResolve(9);
                ctx.guildTable.setup(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, 10)).thenResolve(true);
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
                ctx.discord.setup(m => m.kickGuildMember(ctx.guild.id, ctx.users.command.id, '[Command User#0000] [ Auto-Kick ] Exceeded warning limit (10/10)')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.guildTable.verify(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, 10)).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'modlog')).twice();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'kickat')).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'banat')).once();
                ctx.discord.verify(m => m.kickGuildMember(ctx.guild.id, ctx.users.command.id, '[Command User#0000] [ Auto-Kick ] Exceeded warning limit (10/10)')).once();
            }
        },
        {
            code: '{warn}',
            expected: '11',
            setup(ctx) {
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'actonlimitsonly')).thenResolve(false);
                ctx.guildTable.setup(m => m.getWarnings(ctx.guild.id, ctx.users.command.id)).thenResolve(10);
                ctx.guildTable.setup(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, 11)).thenResolve(true);
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
                ctx.discord.setup(m => m.kickGuildMember(ctx.guild.id, ctx.users.command.id, '[Command User#0000] [ Auto-Kick ] Exceeded warning limit (11/10)')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.guildTable.verify(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, 11)).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'modlog')).twice();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'kickat')).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'banat')).once();
                ctx.discord.verify(m => m.kickGuildMember(ctx.guild.id, ctx.users.command.id, '[Command User#0000] [ Auto-Kick ] Exceeded warning limit (11/10)')).once();
            }
        },
        {
            code: '{warn}',
            expected: '11',
            setup(ctx) {
                ctx.guildTable.setup(m => m.getWarnings(ctx.guild.id, ctx.users.command.id)).thenResolve(10);
                ctx.guildTable.setup(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, 11)).thenResolve(true);
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.guildTable.verify(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, 11)).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'modlog')).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'kickat')).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'banat')).once();
            }
        },
        {
            code: '{warn}',
            expected: '30',
            setup(ctx) {
                ctx.guildTable.setup(m => m.getWarnings(ctx.guild.id, ctx.users.command.id)).thenResolve(29);
                ctx.guildTable.setup(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, undefined)).thenResolve(true);
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id)).thenResolve([]);
                ctx.discord.setup(m => m.banGuildMember(ctx.guild.id, ctx.users.command.id, 1, '[Command User#0000] [ Auto-Ban ] Exceeded ban limit (30/30)')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.guildTable.verify(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, undefined)).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'modlog')).twice();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'kickat')).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'banat')).once();
                ctx.discord.verify(m => m.banGuildMember(ctx.guild.id, ctx.users.command.id, 1, '[Command User#0000] [ Auto-Ban ] Exceeded ban limit (30/30)')).once();
            }
        },
        {
            code: '{warn}',
            expected: '31',
            setup(ctx) {
                ctx.guildTable.setup(m => m.getWarnings(ctx.guild.id, ctx.users.command.id)).thenResolve(30);
                ctx.guildTable.setup(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, 31)).thenResolve(true);
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.guildTable.verify(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, 31)).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'modlog')).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'kickat')).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'banat')).once();
            }
        },
        {
            code: '{warn}',
            expected: '31',
            setup(ctx) {
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'actonlimitsonly')).thenResolve(false);
                ctx.guildTable.setup(m => m.getWarnings(ctx.guild.id, ctx.users.command.id)).thenResolve(30);
                ctx.guildTable.setup(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, undefined)).thenResolve(true);
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
                ctx.discord.setup(m => m.getGuildBans(ctx.guild.id)).thenResolve([]);
                ctx.discord.setup(m => m.banGuildMember(ctx.guild.id, ctx.users.command.id, 1, '[Command User#0000] [ Auto-Ban ] Exceeded ban limit (31/30)')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.guildTable.verify(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, undefined)).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'modlog')).twice();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'kickat')).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'banat')).once();
                ctx.discord.verify(m => m.banGuildMember(ctx.guild.id, ctx.users.command.id, 1, '[Command User#0000] [ Auto-Ban ] Exceeded ban limit (31/30)')).once();
            }
        },
        {
            code: '{warn;}',
            expected: '3',
            setup(ctx) {
                ctx.guildTable.setup(m => m.getWarnings(ctx.guild.id, ctx.users.command.id)).thenResolve(2);
                ctx.guildTable.setup(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, 3)).thenResolve(true);
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.guildTable.verify(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, 3)).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'modlog')).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'kickat')).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'banat')).once();
            }
        },
        {
            code: '{warn;other user}',
            expected: '7',
            setup(ctx) {
                ctx.guildTable.setup(m => m.getWarnings(ctx.guild.id, ctx.users.other.id)).thenResolve(6);
                ctx.guildTable.setup(m => m.setWarnings(ctx.guild.id, ctx.users.other.id, 7)).thenResolve(true);
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.guildTable.verify(m => m.setWarnings(ctx.guild.id, ctx.users.other.id, 7)).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'modlog')).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'kickat')).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'banat')).once();
            }
        },
        {
            code: '{warn;;6}',
            expected: '26',
            setup(ctx) {
                ctx.guildTable.setup(m => m.getWarnings(ctx.guild.id, ctx.users.command.id)).thenResolve(20);
                ctx.guildTable.setup(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, 26)).thenResolve(true);
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.guildTable.verify(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, 26)).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'modlog')).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'kickat')).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'banat')).once();
            }
        },
        {
            code: '{warn;;2}',
            expected: '12',
            setup(ctx) {
                ctx.guildTable.setup(m => m.getWarnings(ctx.guild.id, ctx.users.command.id)).thenResolve(10);
                ctx.guildTable.setup(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, 12)).thenResolve(true);
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.guildTable.verify(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, 12)).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'modlog')).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'kickat')).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'banat')).once();
            }
        },
        {
            code: '{warn;other user;5}',
            expected: '15',
            setup(ctx) {
                ctx.guildTable.setup(m => m.getWarnings(ctx.guild.id, ctx.users.other.id)).thenResolve(10);
                ctx.guildTable.setup(m => m.setWarnings(ctx.guild.id, ctx.users.other.id, 15)).thenResolve(true);
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.guildTable.verify(m => m.setWarnings(ctx.guild.id, ctx.users.other.id, 15)).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'modlog')).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'kickat')).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'banat')).once();
            }
        },
        {
            code: '{warn;other user;8;Because I felt like it}',
            expected: '19',
            setup(ctx) {
                ctx.guildTable.setup(m => m.getWarnings(ctx.guild.id, ctx.users.other.id)).thenResolve(11);
                ctx.guildTable.setup(m => m.setWarnings(ctx.guild.id, ctx.users.other.id, 19)).thenResolve(true);
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.guildTable.verify(m => m.setWarnings(ctx.guild.id, ctx.users.other.id, 19)).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'modlog')).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'kickat')).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'banat')).once();
            }
        },
        {
            code: '{warn;unknown user}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 19, error: new UserNotFoundError('unknown user') }
            ],
            setup(ctx) {
                ctx.options.rootTagName = 'abcdef';
                ctx.discord.setup(m => m.createMessage(ctx.channels.command.id, argument.isDeepEqual({ content: 'No user matching `unknown user` found in tag `abcdef`.' }), undefined)).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.options.rootTagName = 'abcdef';
                ctx.discord.verify(m => m.createMessage(ctx.channels.command.id, argument.isDeepEqual({ content: 'No user matching `unknown user` found in tag `abcdef`.' }), undefined)).once();
            }
        },
        {
            code: '{warn;other user;abc}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 21, error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{warn;{eval};{eval};{eval};{eval}}',
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
