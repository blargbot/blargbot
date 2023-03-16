import { BBTagRuntimeError, Subtag } from '@bbtag/blargbot';
import { ChannelDeleteSubtag } from '@bbtag/blargbot/subtags';
import Discord from '@blargbot/discord-types';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetChannelPropTestCases } from './_getChannelPropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ChannelDeleteSubtag),
    argCountBounds: { min: 1, max: 1 },
    setupEach(ctx) {
        ctx.roles.authorizer.permissions = Discord.PermissionFlagsBits.ManageChannels.toString();
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
                    postSetup(channel, bbctx, ctx) {
                        ctx.dependencies.channels.setup(m => m.delete(bbctx.runtime, channel.id)).thenResolve(undefined);
                    }
                }
            ]
        }),
        {
            title: 'Authorizer is admin',
            code: '{channeldelete;2384762844234324}',
            expected: '',
            setup(ctx) {
                ctx.roles.authorizer.permissions = Discord.PermissionFlagsBits.Administrator.toString();
                ctx.channels.command.id = '2384762844234324';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                ctx.dependencies.channels.setup(m => m.delete(bbctx.runtime, '2384762844234324')).thenResolve(undefined);
            }
        },
        {
            title: 'Authorizer has perms for specific channel',
            code: '{channeldelete;2384762844234324}',
            expected: '',
            setup(ctx) {
                ctx.roles.authorizer.permissions = '0';
                ctx.channels.command.permission_overwrites = [
                    { id: ctx.roles.authorizer.id, type: Discord.OverwriteType.Role, allow: Discord.PermissionFlagsBits.ManageChannels.toString(), deny: '0' }
                ];
                ctx.channels.command.id = '2384762844234324';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                ctx.dependencies.channels.setup(m => m.delete(bbctx.runtime, '2384762844234324')).thenResolve(undefined);
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
                ctx.channels.command.id = '2384762844234324';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                ctx.dependencies.channels.setup(m => m.delete(bbctx.runtime, '2384762844234324')).thenResolve({ error: 'Test REST error' });
            }
        },
        {
            code: '{channeldelete;2384762844234324}',
            expected: '`Failed to edit channel: no perms`',
            errors: [
                { start: 0, end: 32, error: new BBTagRuntimeError('Failed to edit channel: no perms', 'Some other error message') }
            ],
            setup(ctx) {
                ctx.channels.command.id = '2384762844234324';
                ctx.message.channel_id = ctx.channels.command.id;
            },
            postSetup(bbctx, ctx) {
                ctx.dependencies.channels.setup(m => m.delete(bbctx.runtime, '2384762844234324')).thenResolve({ error: 'Some other error message' });
            }
        }
    ]
});
