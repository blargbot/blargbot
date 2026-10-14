import { BBTagRuntimeError, NotANumberError } from '@blargbot/bbtag';
import { ChannelSetPositionSubtag } from '@blargbot/bbtag/subtags';
import * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new ChannelSetPositionSubtag(),
    argCountBounds: { min: 2, max: 2 },
    names: ['channelSetPosition', 'channelSetPos'],
    setup(ctx) {
        ctx.roles.authorizer.permissions = eris.Constants.Permissions.manageChannels.toString();
    },
    cases: [
        {
            code: '{channelsetpos;239874692346327846;123}',
            expected: '',
            postSetup(bbctx, ctx) {
                const channel = bbctx.local.message.channel.guild.channels.random();
                if (channel === undefined)
                    throw new Error('Could not find channel under test');

                ctx.discord.setup(m => m.editChannelPosition(channel.id, 123, undefined)).resolves(undefined);
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '239874692346327846')).resolves([channel]);
            }
        },
        {
            code: '{channelsetpos;239874692346327846;abc}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 38, error: new NotANumberError('abc') }
            ],
            postSetup(bbctx, ctx) {
                const channel = bbctx.local.message.channel.guild.channels.random();
                if (channel === undefined)
                    throw new Error('Could not find channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '239874692346327846')).resolves([channel]);
            }
        },
        {
            code: '{channelsetpos;239874692346327846;123}',
            expected: '`Channel does not exist`',
            errors: [
                { start: 0, end: 38, error: new BBTagRuntimeError('Channel does not exist') }
            ],
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '239874692346327846')).resolves([]);
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
                const channel = bbctx.local.message.channel.guild.channels.random();
                if (channel === undefined)
                    throw new Error('Could not find channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '239874692346327846')).resolves([channel]);
            }
        },
        {
            code: '{channelsetpos;239874692346327846;123}',
            expected: '`Failed to move channel: no perms`',
            errors: [
                { start: 0, end: 38, error: new BBTagRuntimeError('Failed to move channel: no perms', 'Test REST error') }
            ],
            postSetup(bbctx, ctx) {
                const err = ctx.createRESTError(eris.ApiError.MISSING_PERMISSIONS);
                const channel = bbctx.local.message.channel.guild.channels.random();
                if (channel === undefined)
                    throw new Error('Could not find channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '239874692346327846')).resolves([channel]);
                ctx.discord.setup(m => m.editChannelPosition(channel.id, 123, undefined)).rejects(err);
            }
        },
        {
            code: '{channelsetpos;239874692346327846;123}',
            expected: '`Failed to move channel: no perms`',
            errors: [
                { start: 0, end: 38, error: new BBTagRuntimeError('Failed to move channel: no perms', 'Some other error message') }
            ],
            postSetup(bbctx, ctx) {
                const err = ctx.createRESTError(eris.ApiError.NOT_AUTHORIZED, 'Some other error message');
                const channel = bbctx.local.message.channel.guild.channels.random();
                if (channel === undefined)
                    throw new Error('Could not find channel under test');

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '239874692346327846')).resolves([channel]);
                ctx.discord.setup(m => m.editChannelPosition(channel.id, 123, undefined)).rejects(err);
            }
        }
    ]
});
