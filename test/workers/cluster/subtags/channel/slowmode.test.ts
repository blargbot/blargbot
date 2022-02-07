import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { SlowmodeSubtag } from '@cluster/subtags/channel/slowmode';
import { ApiError, Constants, TextChannel } from 'eris';

import { argument } from '../../../../mock';
import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new SlowmodeSubtag(),
    argCountBounds: { min: 0, max: 2 },
    setup(ctx) {
        ctx.roles.command.permissions = Constants.Permissions.manageChannels.toString();
    },
    cases: [
        {
            code: '{slowmode}',
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.editChannel(ctx.channels.command.id, argument.isDeepEqual({ rateLimitPerUser: 0 }), 'Command User#0000'))
                    .thenResolve(ctx.createMock(TextChannel).instance);
            }
        },
        {
            code: '{slowmode;1234}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findChannels(bbctx.guild, '1234')).thenResolve([]);
                ctx.discord.setup(m => m.editChannel(ctx.channels.command.id, argument.isDeepEqual({ rateLimitPerUser: 1234 }), 'Command User#0000'))
                    .thenResolve(ctx.createMock(TextChannel).instance);
            }
        },
        {
            code: '{slowmode;2342543235325252345}',
            expected: '',
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.random();
                if (channel === undefined)
                    throw new Error('Failed to locate channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '2342543235325252345')).thenResolve([channel]);
                ctx.discord.setup(m => m.editChannel(channel.id, argument.isDeepEqual({ rateLimitPerUser: 0 }), 'Command User#0000'))
                    .thenResolve(channel);
            }
        },
        {
            code: '{slowmode;2342543235325252345;37645}',
            expected: '',
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.random();
                if (channel === undefined)
                    throw new Error('Failed to locate channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '2342543235325252345')).thenResolve([channel]);
                ctx.discord.setup(m => m.editChannel(channel.id, argument.isDeepEqual({ rateLimitPerUser: 21600 }), 'Command User#0000'))
                    .thenResolve(channel);
            }
        },
        {
            code: '{slowmode;2342543235325252345;this is some random text}',
            expected: '',
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.random();
                if (channel === undefined)
                    throw new Error('Failed to locate channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '2342543235325252345')).thenResolve([channel]);
                ctx.discord.setup(m => m.editChannel(channel.id, argument.isDeepEqual({ rateLimitPerUser: 0 }), 'Command User#0000'))
                    .thenResolve(channel);
            }
        },
        {
            code: '{slowmode;2342543235325252345}',
            expected: '`Missing required permissions`',
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Missing required permissions') }
            ],
            postSetup(bbctx, ctx) {
                const err = ctx.createRESTError(ApiError.MISSING_PERMISSIONS);
                const channel = bbctx.guild.channels.random();
                if (channel === undefined)
                    throw new Error('Failed to locate channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '2342543235325252345')).thenResolve([channel]);
                ctx.discord.setup(m => m.editChannel(channel.id, argument.isDeepEqual({ rateLimitPerUser: 0 }), 'Command User#0000')).thenReject(err);
            }
        },
        {
            code: '{slowmode;2342543235325252345}',
            expected: '`Failed to edit channel: Some other error message`',
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Failed to edit channel: Some other error message') }
            ],
            postSetup(bbctx, ctx) {
                const err = ctx.createRESTError(ApiError.NOT_AUTHORIZED, 'Some other error message');
                const channel = bbctx.guild.channels.random();
                if (channel === undefined)
                    throw new Error('Failed to locate channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '2342543235325252345')).thenResolve([channel]);
                ctx.discord.setup(m => m.editChannel(channel.id, argument.isDeepEqual({ rateLimitPerUser: 0 }), 'Command User#0000')).thenReject(err);
            }
        }
    ]
});
