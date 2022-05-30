import { BBTagRuntimeError, ChannelNotFoundError } from '@blargbot/bbtag/errors';
import { DeleteThreadSubtag } from '@blargbot/bbtag/subtags/thread/deletethread';
import { ChannelType } from 'discord-api-types/v9';
import { ApiError, Constants } from 'eris';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new DeleteThreadSubtag(),
    argCountBounds: { min: 0, max: 1 },
    cases: [
        {
            code: '{deletethread}',
            expected: 'true',
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.manageThreads.toString();
                ctx.roles.bot.permissions = Constants.Permissions.manageThreads.toString();

                ctx.channels.command.type = ChannelType.GuildPublicThread;
                ctx.discord.setup(m => m.deleteChannel(ctx.channels.command.id, 'Command User#0000')).thenResolve(undefined);
            }
        },
        {
            code: '{deletethread;12345678912345678}',
            expected: 'true',
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.manageThreads.toString();
                ctx.roles.bot.permissions = Constants.Permissions.manageThreads.toString();

                ctx.channels.command.type = ChannelType.GuildPublicThread;
                ctx.channels.command.id = '12345678912345678';
                ctx.message.channel_id = ctx.channels.command.id;
                ctx.discord.setup(m => m.deleteChannel('12345678912345678', 'Command User#0000')).thenResolve(undefined);
            }
        },
        {
            code: '{deletethread;12345678912345678}',
            expected: '`No channel found`',
            errors: [
                { start: 0, end: 32, error: new ChannelNotFoundError('12345678912345678')}
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findChannels(bbctx.guild, '12345678912345678')).thenResolve([]);
            }
        },
        {
            code: '{deletethread}',
            expected: '`Failed to delete thread: Some error message`',
            errors: [
                { start: 0, end: 14, error: new BBTagRuntimeError('Failed to delete thread: Some error message') }
            ],
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.manageThreads.toString();
                ctx.roles.bot.permissions = Constants.Permissions.manageThreads.toString();
                ctx.channels.command.type = ChannelType.GuildPublicThread;

                const err = ctx.createRESTError(ApiError.UNAUTHORIZED, 'Some error message');
                ctx.discord.setup(m => m.deleteChannel(ctx.channels.command.id, 'Command User#0000')).thenReject(err);
            }
        }
    ]
});
