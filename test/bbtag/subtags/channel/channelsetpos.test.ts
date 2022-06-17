import { BBTagRuntimeError, NotANumberError } from '@blargbot/bbtag/errors';
import { ChannelSetPosSubtag } from '@blargbot/bbtag/subtags/channel/channelsetpos';
import { ApiError, Constants } from 'eris';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new ChannelSetPosSubtag(),
    argCountBounds: { min: 2, max: 2 },
    setup(ctx) {
        ctx.roles.authorizer.permissions = Constants.Permissions.manageChannels.toString();
    },
    cases: [
        {
            code: '{channelsetpos;239874692346327846;123}',
            expected: '',
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.random();
                if (channel === undefined)
                    throw new Error('Could not find channel under test');

                ctx.discord.setup(m => m.editChannelPosition(channel.id, 123, undefined)).thenResolve(undefined);
                ctx.util.setup(m => m.findChannels(bbctx.guild, '239874692346327846')).thenResolve([channel]);
            }
        },
        {
            code: '{channelsetpos;239874692346327846;abc}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 38, error: new NotANumberError('abc') }
            ],
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.random();
                if (channel === undefined)
                    throw new Error('Could not find channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '239874692346327846')).thenResolve([channel]);
            }
        },
        {
            code: '{channelsetpos;239874692346327846;123}',
            expected: '`Channel does not exist`',
            errors: [
                { start: 0, end: 38, error: new BBTagRuntimeError('Channel does not exist') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findChannels(bbctx.guild, '239874692346327846')).thenResolve([]);
            }
        },
        {
            code: '{channelsetpos;239874692346327846;123}',
            expected: '`Author cannot move this channel`',
            errors: [
                { start: 0, end: 38, error: new BBTagRuntimeError('Author cannot move this channel') }
            ],
            setup(ctx) {
                ctx.roles.authorizer.permissions = '0';
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.random();
                if (channel === undefined)
                    throw new Error('Could not find channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '239874692346327846')).thenResolve([channel]);
            }
        },
        {
            code: '{channelsetpos;239874692346327846;123}',
            expected: '`Failed to move channel: no perms`',
            errors: [
                { start: 0, end: 38, error: new BBTagRuntimeError('Failed to move channel: no perms', 'Test REST error') }
            ],
            postSetup(bbctx, ctx) {
                const err = ctx.createRESTError(ApiError.MISSING_PERMISSIONS);
                const channel = bbctx.guild.channels.random();
                if (channel === undefined)
                    throw new Error('Could not find channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '239874692346327846')).thenResolve([channel]);
                ctx.discord.setup(m => m.editChannelPosition(channel.id, 123, undefined)).thenReject(err);
            }
        },
        {
            code: '{channelsetpos;239874692346327846;123}',
            expected: '`Failed to move channel: no perms`',
            errors: [
                { start: 0, end: 38, error: new BBTagRuntimeError('Failed to move channel: no perms', 'Some other error message') }
            ],
            postSetup(bbctx, ctx) {
                const err = ctx.createRESTError(ApiError.NOT_AUTHORIZED, 'Some other error message');
                const channel = bbctx.guild.channels.random();
                if (channel === undefined)
                    throw new Error('Could not find channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.guild, '239874692346327846')).thenResolve([channel]);
                ctx.discord.setup(m => m.editChannelPosition(channel.id, 123, undefined)).thenReject(err);
            }
        }
    ]
});
