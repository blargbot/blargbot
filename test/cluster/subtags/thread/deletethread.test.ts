import { BBTagRuntimeError } from '@blargbot/cluster/bbtag/errors';
import { DeleteThreadSubtag } from '@blargbot/cluster/subtags/thread/deletethread';
import { ChannelType } from 'discord-api-types';
import { ApiError } from 'eris';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new DeleteThreadSubtag(),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{deletethread}',
            expected: 'true',
            setup(ctx) {
                ctx.channels.command.type = ChannelType.GuildPublicThread;
                ctx.discord.setup(m => m.deleteChannel(ctx.channels.command.id, 'Command User#0000')).thenResolve(undefined);
            }
        },
        {
            code: '{deletethread}',
            expected: '`Not a thread channel`',
            errors: [
                { start: 0, end: 14, error: new BBTagRuntimeError('Not a thread channel') }
            ]
        },
        {
            code: '{deletethread}',
            expected: '`Failed to delete thread: Some error message`',
            errors: [
                { start: 0, end: 14, error: new BBTagRuntimeError('Failed to delete thread: Some error message') }
            ],
            setup(ctx) {
                ctx.channels.command.type = ChannelType.GuildPublicThread;
                const err = ctx.createRESTError(ApiError.MISSING_PERMISSIONS, 'Some error message');
                ctx.discord.setup(m => m.deleteChannel(ctx.channels.command.id, 'Command User#0000')).thenReject(err);
            }
        }
    ]
});
