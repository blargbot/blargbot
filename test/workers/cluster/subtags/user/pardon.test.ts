import { NotANumberError, TooManyArgumentsError, UserNotFoundError } from '@cluster/bbtag/errors';
import { ModerationManager } from '@cluster/managers';
import { PardonSubtag } from '@cluster/subtags/user/pardon';

import { argument } from '../../../../mock';
import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new PardonSubtag(),
    setup(ctx) {
        ctx.cluster.setup(m => m.moderation).thenReturn(new ModerationManager(ctx.cluster.instance));
    },
    cases: [
        {
            code: '{pardon}',
            expected: '0',
            setup(ctx) {
                ctx.guildTable.setup(m => m.getWarnings(ctx.guild.id, ctx.users.command.id)).thenResolve(undefined);
                ctx.guildTable.setup(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, undefined)).thenResolve(true);
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.guildTable.verify(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, undefined)).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'modlog')).once();
            }
        },
        {
            code: '{pardon}',
            expected: '5',
            setup(ctx) {
                ctx.guildTable.setup(m => m.getWarnings(ctx.guild.id, ctx.users.command.id)).thenResolve(6);
                ctx.guildTable.setup(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, 5)).thenResolve(true);
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.guildTable.verify(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, 5)).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'modlog')).once();
            }
        },
        {
            code: '{pardon;}',
            expected: '3',
            setup(ctx) {
                ctx.guildTable.setup(m => m.getWarnings(ctx.guild.id, ctx.users.command.id)).thenResolve(4);
                ctx.guildTable.setup(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, 3)).thenResolve(true);
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.guildTable.verify(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, 3)).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'modlog')).once();
            }
        },
        {
            code: '{pardon;other user}',
            expected: '7',
            setup(ctx) {
                ctx.guildTable.setup(m => m.getWarnings(ctx.guild.id, ctx.users.other.id)).thenResolve(8);
                ctx.guildTable.setup(m => m.setWarnings(ctx.guild.id, ctx.users.other.id, 7)).thenResolve(true);
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.guildTable.verify(m => m.setWarnings(ctx.guild.id, ctx.users.other.id, 7)).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'modlog')).once();
            }
        },
        {
            code: '{pardon;;6}',
            expected: '26',
            setup(ctx) {
                ctx.guildTable.setup(m => m.getWarnings(ctx.guild.id, ctx.users.command.id)).thenResolve(32);
                ctx.guildTable.setup(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, 26)).thenResolve(true);
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.guildTable.verify(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, 26)).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'modlog')).once();
            }
        },
        {
            code: '{pardon;;9}',
            expected: '0',
            setup(ctx) {
                ctx.guildTable.setup(m => m.getWarnings(ctx.guild.id, ctx.users.command.id)).thenResolve(5);
                ctx.guildTable.setup(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, undefined)).thenResolve(true);
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.guildTable.verify(m => m.setWarnings(ctx.guild.id, ctx.users.command.id, undefined)).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'modlog')).once();
            }
        },
        {
            code: '{pardon;other user;5}',
            expected: '15',
            setup(ctx) {
                ctx.guildTable.setup(m => m.getWarnings(ctx.guild.id, ctx.users.other.id)).thenResolve(20);
                ctx.guildTable.setup(m => m.setWarnings(ctx.guild.id, ctx.users.other.id, 15)).thenResolve(true);
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.guildTable.verify(m => m.setWarnings(ctx.guild.id, ctx.users.other.id, 15)).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'modlog')).once();
            }
        },
        {
            code: '{pardon;other user;8;Because I felt like it}',
            expected: '6',
            setup(ctx) {
                ctx.guildTable.setup(m => m.getWarnings(ctx.guild.id, ctx.users.other.id)).thenResolve(14);
                ctx.guildTable.setup(m => m.setWarnings(ctx.guild.id, ctx.users.other.id, 6)).thenResolve(true);
                ctx.guildTable.setup(m => m.getSetting(ctx.guild.id, 'modlog')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.guildTable.verify(m => m.setWarnings(ctx.guild.id, ctx.users.other.id, 6)).once();
                ctx.guildTable.verify(m => m.getSetting(ctx.guild.id, 'modlog')).once();
            }
        },
        {
            code: '{pardon;unknown user}',
            expected: '`No user found`',
            errors: [
                { start: 0, end: 21, error: new UserNotFoundError('unknown user') }
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
            code: '{pardon;other user;abc}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 23, error: new NotANumberError('abc') }
            ]
        },
        {
            code: '{pardon;{eval};{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) },
                { start: 15, end: 21, error: new MarkerError('eval', 15) },
                { start: 22, end: 28, error: new MarkerError('eval', 22) },
                { start: 29, end: 35, error: new MarkerError('eval', 29) },
                { start: 0, end: 36, error: new TooManyArgumentsError(3, 4) }
            ]
        }
    ]
});
