import { Subtag } from '@blargbot/bbtag';
import { BBTagRuntimeError, NotANumberError } from '@blargbot/bbtag/errors/index.js';
import { ChannelSetPositionSubtag } from '@blargbot/bbtag/subtags/channel/channelSetPosition.js';
import { randChoose } from '@blargbot/core/utils/index.js';
import { argument } from '@blargbot/test-util/mock.js';
import Discord from 'discord-api-types/v10';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(ChannelSetPositionSubtag),
    argCountBounds: { min: 2, max: 2 },
    setupEach(ctx) {
        ctx.roles.authorizer.permissions = Discord.PermissionFlagsBits.ManageChannels.toString();
    },
    cases: [
        {
            code: '{channelsetpos;239874692346327846;123}',
            expected: '',
            postSetup(bbctx, ctx) {
                const channel = randChoose(Object.values(ctx.channels));
                ctx.channelService.setup(m => m.edit(bbctx, channel.id, argument.isDeepEqual({ position: 123 }))).thenResolve(undefined);
                ctx.channelService.setup(m => m.querySingle(bbctx, '239874692346327846')).thenResolve(channel);
            }
        },
        {
            code: '{channelsetpos;239874692346327846;abc}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 38, error: new NotANumberError('abc') }
            ],
            postSetup(bbctx, ctx) {
                const channel = randChoose(Object.values(ctx.channels));
                ctx.channelService.setup(m => m.querySingle(bbctx, '239874692346327846')).thenResolve(channel);
            }
        },
        {
            code: '{channelsetpos;239874692346327846;123}',
            expected: '`Channel does not exist`',
            errors: [
                { start: 0, end: 38, error: new BBTagRuntimeError('Channel does not exist') }
            ],
            postSetup(bbctx, ctx) {
                ctx.channelService.setup(m => m.querySingle(bbctx, '239874692346327846')).thenResolve();
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
                const channel = randChoose(Object.values(ctx.channels));
                ctx.channelService.setup(m => m.querySingle(bbctx, '239874692346327846')).thenResolve(channel);
            }
        },
        {
            code: '{channelsetpos;239874692346327846;123}',
            expected: '`Failed to move channel: no perms`',
            errors: [
                { start: 0, end: 38, error: new BBTagRuntimeError('Failed to move channel: no perms', 'Test REST error') }
            ],
            postSetup(bbctx, ctx) {
                const channel = randChoose(Object.values(ctx.channels));
                ctx.channelService.setup(m => m.querySingle(bbctx, '239874692346327846')).thenResolve(channel);
                ctx.channelService.setup(m => m.edit(bbctx, channel.id, argument.isDeepEqual({ position: 123 })))
                    .thenResolve({ error: 'Test REST error' });
            }
        },
        {
            code: '{channelsetpos;239874692346327846;123}',
            expected: '`Failed to move channel: no perms`',
            errors: [
                { start: 0, end: 38, error: new BBTagRuntimeError('Failed to move channel: no perms', 'Some other error message') }
            ],
            postSetup(bbctx, ctx) {
                const channel = randChoose(Object.values(ctx.channels));
                ctx.channelService.setup(m => m.querySingle(bbctx, '239874692346327846')).thenResolve(channel);
                ctx.channelService.setup(m => m.edit(bbctx, channel.id, argument.isDeepEqual({ position: 123 })))
                    .thenResolve({ error: 'Some other error message' });
            }
        }
    ]
});
