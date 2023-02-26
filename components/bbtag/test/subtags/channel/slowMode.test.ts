import { randomInt } from 'node:crypto';

import { BBTagRuntimeError, Subtag } from '@bbtag/blargbot';
import { SlowModeSubtag } from '@bbtag/blargbot/subtags';
import Discord from '@blargbot/discord-types';
import { argument } from '@blargbot/test-util/mock.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(SlowModeSubtag),
    argCountBounds: { min: 0, max: 2 },
    setupEach(ctx) {
        ctx.roles.authorizer.permissions = Discord.PermissionFlagsBits.ManageChannels.toString();
    },
    cases: [
        {
            code: '{slowmode}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.channelService.setup(m => m.edit(bbctx, ctx.channels.command.id, argument.isDeepEqual({ rateLimitPerUser: 0 })))
                    .thenResolve(undefined);
            }
        },
        {
            code: '{slowmode;1234}',
            expected: '',
            postSetup(bbctx, ctx) {
                ctx.channelService.setup(m => m.querySingle(bbctx, '1234', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve();
                ctx.channelService.setup(m => m.edit(bbctx, ctx.channels.command.id, argument.isDeepEqual({ rateLimitPerUser: 1234 })))
                    .thenResolve(undefined);
            }
        },
        {
            code: '{slowmode;2342543235325252345}',
            expected: '',
            postSetup(bbctx, ctx) {
                const choices = Object.values(ctx.channels);
                const channel = choices[randomInt(choices.length)];
                ctx.channelService.setup(m => m.querySingle(bbctx, '2342543235325252345', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(channel);
                ctx.channelService.setup(m => m.edit(bbctx, channel.id, argument.isDeepEqual({ rateLimitPerUser: 0 })))
                    .thenResolve(undefined);
            }
        },
        {
            code: '{slowmode;2342543235325252345;37645}',
            expected: '',
            postSetup(bbctx, ctx) {
                const choices = Object.values(ctx.channels);
                const channel = choices[randomInt(choices.length)];
                ctx.channelService.setup(m => m.querySingle(bbctx, '2342543235325252345', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(channel);
                ctx.channelService.setup(m => m.edit(bbctx, channel.id, argument.isDeepEqual({ rateLimitPerUser: 21600 })))
                    .thenResolve(undefined);
            }
        },
        {
            code: '{slowmode;2342543235325252345;this is some random text}',
            expected: '',
            postSetup(bbctx, ctx) {
                const choices = Object.values(ctx.channels);
                const channel = choices[randomInt(choices.length)];
                ctx.channelService.setup(m => m.querySingle(bbctx, '2342543235325252345', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(channel);
                ctx.channelService.setup(m => m.edit(bbctx, channel.id, argument.isDeepEqual({ rateLimitPerUser: 0 })))
                    .thenResolve(undefined);
            }
        },
        {
            code: '{slowmode;2342543235325252345}',
            expected: '`Missing required permissions`',
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Missing required permissions', 'Test REST error') }
            ],
            postSetup(bbctx, ctx) {
                const choices = Object.values(ctx.channels);
                const channel = choices[randomInt(choices.length)];
                ctx.channelService.setup(m => m.querySingle(bbctx, '2342543235325252345', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(channel);
                ctx.channelService.setup(m => m.edit(bbctx, channel.id, argument.isDeepEqual({ rateLimitPerUser: 0 })))
                    .thenResolve({ error: 'Test REST error' });
            }
        },
        {
            code: '{slowmode;2342543235325252345}',
            expected: '`Missing required permissions`',
            errors: [
                { start: 0, end: 30, error: new BBTagRuntimeError('Missing required permissions', 'Some other error message') }
            ],
            postSetup(bbctx, ctx) {
                const choices = Object.values(ctx.channels);
                const channel = choices[randomInt(choices.length)];
                ctx.channelService.setup(m => m.querySingle(bbctx, '2342543235325252345', argument.isDeepEqual({ noLookup: true })))
                    .thenResolve(channel);
                ctx.channelService.setup(m => m.edit(bbctx, channel.id, argument.isDeepEqual({ rateLimitPerUser: 0 })))
                    .thenResolve({ error: 'Some other error message' });
            }
        }
    ]
});
