import { NotEnoughArgumentsError, TooManyArgumentsError, UserNotFoundError } from '@cluster/bbtag/errors';
import { UserSetNickSubtag } from '@cluster/subtags/user/usersetnick';

import { argument } from '../../../../mock';
import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new UserSetNickSubtag(),
    cases: [
        {
            code: '{usersetnick}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 13, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        {
            code: '{usersetnick;abc}',
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.editGuildMember(ctx.guild.id, ctx.users.command.id, argument.isDeepEqual({ nick: 'abc' }), 'Command User#0000')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.editGuildMember(ctx.guild.id, ctx.users.command.id, argument.isDeepEqual({ nick: 'abc' }), 'Command User#0000')).once();
            }
        },
        {
            code: '{usersetnick;abc;other user}',
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.editGuildMember(ctx.guild.id, ctx.users.other.id, argument.isDeepEqual({ nick: 'abc' }), 'Command User#0000')).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.editGuildMember(ctx.guild.id, ctx.users.other.id, argument.isDeepEqual({ nick: 'abc' }), 'Command User#0000')).once();
            }
        },
        {
            code: '{usersetnick;abc;blargbot}',
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.editGuildMember(ctx.guild.id, ctx.users.bot.id, argument.isDeepEqual({ nick: 'abc' }), undefined)).thenResolve();
            },
            assert(_, __, ctx) {
                ctx.discord.verify(m => m.editGuildMember(ctx.guild.id, ctx.users.bot.id, argument.isDeepEqual({ nick: 'abc' }), undefined)).once();
            }
        },
        {
            code: '{usersetnick;{eval};unknown user}',
            expected: '`No user found`',
            errors: [
                { start: 13, end: 19, error: new MarkerError('eval', 13) },
                { start: 0, end: 33, error: new UserNotFoundError('unknown user') }
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
            code: '{usersetnick;{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 13, end: 19, error: new MarkerError('eval', 13) },
                { start: 20, end: 26, error: new MarkerError('eval', 20) },
                { start: 27, end: 33, error: new MarkerError('eval', 27) },
                { start: 0, end: 34, error: new TooManyArgumentsError(2, 3) }
            ]
        }
    ]
});
