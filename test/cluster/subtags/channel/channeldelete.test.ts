import { BBTagRuntimeError } from '@blargbot/cluster/bbtag/errors';
import { ChannelDeleteSubtag } from '@blargbot/cluster/subtags/channel/channeldelete';
import { OverwriteType } from 'discord-api-types';
import { ApiError, Constants } from 'eris';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetChannelPropTestCases } from './_getChannelPropTest';

runSubtagTests({
    subtag: new ChannelDeleteSubtag(),
    argCountBounds: { min: 1, max: 1 },
    setup(ctx) {
        ctx.roles.command.permissions = Constants.Permissions.manageChannels.toString();
    },
    cases: [
        ...createGetChannelPropTestCases({
            quiet: false,
            includeNoArgs: false,
            generateCode(...args) {
                return `{${['channeldelete', ...args].join(';')}}`;
            },
            notFound: () => new BBTagRuntimeError('Channel does not exist'),
            cases: [
                {
                    expected: '',
                    setup(channel, ctx) {
                        ctx.discord.setup(m => m.deleteChannel(channel.id, 'Command User#0000')).thenResolve(undefined);
                    }
                }
            ]
        }),
        {
            title: 'Authorizer is admin',
            code: '{channeldelete;2384762844234324}',
            expected: '',
            setup(ctx) {
                ctx.roles.command.permissions = Constants.Permissions.administrator.toString();
                ctx.channels.command.id = '2384762844234324';
                ctx.message.channel_id = ctx.channels.command.id;
                ctx.discord.setup(m => m.deleteChannel('2384762844234324', 'Command User#0000')).thenResolve(undefined);
            }
        },
        {
            title: 'Authorizer has perms for specific channel',
            code: '{channeldelete;2384762844234324}',
            expected: '',
            setup(ctx) {
                ctx.roles.command.permissions = '0';
                ctx.channels.command.permission_overwrites = [
                    { id: ctx.roles.command.id, type: OverwriteType.Role, allow: Constants.Permissions.manageChannels.toString(), deny: '0' }
                ];
                ctx.channels.command.id = '2384762844234324';
                ctx.message.channel_id = ctx.channels.command.id;
                ctx.discord.setup(m => m.deleteChannel('2384762844234324', 'Command User#0000')).thenResolve(undefined);
            }
        },
        {
            code: '{channeldelete;2384762844234324}',
            expected: '`Author cannot edit this channel`',
            errors: [
                { start: 0, end: 32, error: new BBTagRuntimeError('Author cannot edit this channel') }
            ],
            setup(ctx) {
                ctx.roles.command.permissions = '0';
                ctx.channels.command.id = '2384762844234324';
                ctx.message.channel_id = ctx.channels.command.id;
            }
        },
        {
            code: '{channeldelete;2384762844234324}',
            expected: '`Failed to edit channel: no perms`',
            errors: [
                { start: 0, end: 32, error: new BBTagRuntimeError('Failed to edit channel: no perms') }
            ],
            setup(ctx) {
                const err = ctx.createRESTError(ApiError.MISSING_PERMISSIONS);
                ctx.channels.command.id = '2384762844234324';
                ctx.message.channel_id = ctx.channels.command.id;
                ctx.discord.setup(m => m.deleteChannel('2384762844234324', 'Command User#0000')).thenReject(err);
            }
        },
        {
            code: '{channeldelete;2384762844234324}',
            expected: '`Failed to edit channel: Some other error message`',
            errors: [
                { start: 0, end: 32, error: new BBTagRuntimeError('Failed to edit channel: Some other error message') }
            ],
            setup(ctx) {
                const err = ctx.createRESTError(ApiError.NOT_AUTHORIZED, 'Some other error message');
                ctx.channels.command.id = '2384762844234324';
                ctx.message.channel_id = ctx.channels.command.id;
                ctx.discord.setup(m => m.deleteChannel('2384762844234324', 'Command User#0000')).thenReject(err);
            }
        }
    ]
});
