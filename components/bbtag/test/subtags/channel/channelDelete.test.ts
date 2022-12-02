import { BBTagRuntimeError } from '@blargbot/bbtag/errors/index.js';
import { ChannelDeleteSubtag } from '@blargbot/bbtag/subtags/channel/channelDelete.js';
import { OverwriteType } from 'discord-api-types/v9';
import Eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

runSubtagTests({
    subtag: new ChannelDeleteSubtag(),
    argCountBounds: { min: 1, max: 1 },
    setup(ctx) {
        ctx.roles.authorizer.permissions = Eris.Constants.Permissions.manageChannels.toString();
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
                ctx.roles.authorizer.permissions = Eris.Constants.Permissions.administrator.toString();
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
                ctx.roles.authorizer.permissions = '0';
                ctx.channels.command.permission_overwrites = [
                    { id: ctx.roles.authorizer.id, type: OverwriteType.Role, allow: Eris.Constants.Permissions.manageChannels.toString(), deny: '0' }
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
                ctx.roles.authorizer.permissions = '0';
                ctx.channels.command.id = '2384762844234324';
                ctx.message.channel_id = ctx.channels.command.id;
            }
        },
        {
            code: '{channeldelete;2384762844234324}',
            expected: '`Failed to edit channel: no perms`',
            errors: [
                { start: 0, end: 32, error: new BBTagRuntimeError('Failed to edit channel: no perms', 'Test REST error') }
            ],
            setup(ctx) {
                const err = ctx.createRESTError(Eris.ApiError.MISSING_PERMISSIONS);
                ctx.channels.command.id = '2384762844234324';
                ctx.message.channel_id = ctx.channels.command.id;
                ctx.discord.setup(m => m.deleteChannel('2384762844234324', 'Command User#0000')).thenReject(err);
            }
        },
        {
            code: '{channeldelete;2384762844234324}',
            expected: '`Failed to edit channel: no perms`',
            errors: [
                { start: 0, end: 32, error: new BBTagRuntimeError('Failed to edit channel: no perms', 'Some other error message') }
            ],
            setup(ctx) {
                const err = ctx.createRESTError(Eris.ApiError.NOT_AUTHORIZED, 'Some other error message');
                ctx.channels.command.id = '2384762844234324';
                ctx.message.channel_id = ctx.channels.command.id;
                ctx.discord.setup(m => m.deleteChannel('2384762844234324', 'Command User#0000')).thenReject(err);
            }
        }
    ]
});
