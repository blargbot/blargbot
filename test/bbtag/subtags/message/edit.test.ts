import assert from 'node:assert/strict';

import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '@blargbot/bbtag';
import { EditSubtag, EscapeBBTagSubtag } from '@blargbot/bbtag/subtags';
import type { Logger } from '@blargbot/logger';
import { Mock } from '@blargbot/test-util';
import type * as eris from 'eris';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite.js';

const logger = new Mock<Logger>({ id: 'logger' });

await runSubtagTests({
    subtag: new EditSubtag({
        logger: logger.instance
    }),
    argCountBounds: { min: 2, max: 4 },
    names: ['edit'],
    setup(ctx) {
        ctx.addMock(logger);
        logger.reset();
    },
    cases: [
        {
            title: 'When the message cannot be found',
            code: '{edit;12345678901234567;New message text}',
            expected: '`No message found`',
            setup(ctx) {
                ctx.message.channel_id = ctx.channels.command.id = '987654321123456789';
            },
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.getMessage(bbctx.local.message.channel, '12345678901234567', false)).resolves(undefined);
            },
            errors: [
                { start: 0, end: 41, error: new MessageNotFoundError('987654321123456789', '12345678901234567') }
            ]
        },
        {
            title: 'When the message wasnt sent by the bot',
            code: '{edit;12345678901234567;New message text}',
            expected: '`I must be the message author`',
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: bbctx.local.message.channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.command));

                ctx.util.setup(m => m.getMessage(bbctx.local.message.channel, '12345678901234567', false)).resolves(message);
            },
            errors: [
                { start: 0, end: 41, error: new BBTagRuntimeError('I must be the message author') }
            ]
        },
        {
            title: 'When the message is empty',
            code: '{edit;12345678901234567;_delete}',
            expected: '`Message cannot be empty`',
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: bbctx.local.message.channel.id,
                    id: '12345678901234567',
                    content: 'Original message text'
                }, ctx.users.bot));

                ctx.util.setup(m => m.getMessage(bbctx.local.message.channel, '12345678901234567', false)).resolves(message);
            },
            errors: [
                { start: 0, end: 32, error: new BBTagRuntimeError('Message cannot be empty') }
            ]
        },
        {
            code: '{edit;12345678901234567;New message text}',
            expected: '',
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: bbctx.local.message.channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot));

                ctx.util.setup(m => m.getMessage(bbctx.local.message.channel, '12345678901234567', false)).resolves(message);
                ctx.discord.setup((m, $) => m.editMessage(bbctx.local.message.channel.id, message.id, $({
                    content: 'New message text',
                    embeds: message.embeds
                }))).resolves(message);
            }
        },
        {
            code: '{edit;12345678901234567;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: bbctx.local.message.channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot));

                ctx.util.setup(m => m.getMessage(bbctx.local.message.channel, '12345678901234567', false)).resolves(message);
                ctx.discord.setup((m, $) => m.editMessage(bbctx.local.message.channel.id, message.id, $({
                    content: 'Original message text',
                    embeds: [{ title: 'New embed!' }]
                }))).resolves(message);
            }
        },
        {
            code: '{edit;12345678901234567;{escapebbtag;{"title":false}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: bbctx.local.message.channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot));

                ctx.util.setup(m => m.getMessage(bbctx.local.message.channel, '12345678901234567', false)).resolves(message);
                ctx.discord.setup((m, $) => m.editMessage(bbctx.local.message.channel.id, message.id, $({
                    content: '{"title":false}',
                    embeds: message.embeds
                }))).resolves(message);
            }
        },
        {
            code: '{edit;12345678901234567;_delete}',
            expected: '',
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: bbctx.local.message.channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot));

                ctx.util.setup(m => m.getMessage(bbctx.local.message.channel, '12345678901234567', false)).resolves(message);
                ctx.discord.setup((m, $) => m.editMessage(bbctx.local.message.channel.id, message.id, $({
                    content: '',
                    embeds: message.embeds
                }))).resolves(message);
            }
        },
        {
            code: '{edit;12345678901234567;New message text;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: bbctx.local.message.channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '12345678901234567')).resolves([]);
                ctx.util.setup(m => m.getMessage(bbctx.local.message.channel, '12345678901234567', false)).resolves(message);
                ctx.discord.setup((m, $) => m.editMessage(bbctx.local.message.channel.id, message.id, $({
                    content: 'New message text',
                    embeds: [{ title: 'New embed!' }]
                }))).resolves(message);
            }
        },
        {
            code: '{edit;12345678901234567;{escapebbtag;{"title":"New embed!"}};New message text}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: bbctx.local.message.channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '12345678901234567')).resolves([]);
                ctx.util.setup(m => m.getMessage(bbctx.local.message.channel, '12345678901234567', false)).resolves(message);
                ctx.discord.setup((m, $) => m.editMessage(bbctx.local.message.channel.id, message.id, $({
                    content: '{"title":"New embed!"}',
                    embeds: [{ fields: [{ name: 'Malformed JSON', value: '"New message text"' }], malformed: true }]
                }))).resolves(message);
            }
        },
        {
            title: 'When the message is empty',
            code: '{edit;12345678901234567;_delete;_delete}',
            expected: '`Message cannot be empty`',
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: bbctx.local.message.channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '12345678901234567')).resolves([]);
                ctx.util.setup(m => m.getMessage(bbctx.local.message.channel, '12345678901234567', false)).resolves(message);
            },
            errors: [
                { start: 0, end: 40, error: new BBTagRuntimeError('Message cannot be empty') }
            ]
        },
        {
            code: '{edit;9876543212345678;12345678901234567;New message text}',
            expected: '',
            setup(ctx) {
                ctx.channels.general.id = '9876543212345678';
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.local.message.channel.guild.channels.get('9876543212345678') as eris.KnownGuildTextableChannel;
                assert.notEqual(channel, undefined);
                assert.notEqual(channel, null);
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, channel.id)).resolves([channel]);
                ctx.util.setup(m => m.getMessage(channel, '12345678901234567', false)).resolves(message);
                ctx.discord.setup((m, $) => m.editMessage(channel.id, message.id, $({
                    content: 'New message text',
                    embeds: message.embeds
                }))).resolves(message);
            }
        },
        {
            code: '{edit;9876543212345678;12345678901234567;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.channels.general.id = '9876543212345678';
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.local.message.channel.guild.channels.get('9876543212345678') as eris.KnownGuildTextableChannel;
                assert.notEqual(channel, undefined);
                assert.notEqual(channel, null);
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, channel.id)).resolves([channel]);
                ctx.util.setup(m => m.getMessage(channel, '12345678901234567', false)).resolves(message);
                ctx.discord.setup((m, $) => m.editMessage(channel.id, message.id, $({
                    content: 'Original message text',
                    embeds: [{ title: 'New embed!' }]
                }))).resolves(message);
            }
        },
        {
            code: '{edit;9876543212345678;12345678901234567;{escapebbtag;{"title":false}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.channels.general.id = '9876543212345678';
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.local.message.channel.guild.channels.get('9876543212345678') as eris.KnownGuildTextableChannel;
                assert.notEqual(channel, undefined);
                assert.notEqual(channel, null);
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, channel.id)).resolves([channel]);
                ctx.util.setup(m => m.getMessage(channel, '12345678901234567', false)).resolves(message);
                ctx.discord.setup((m, $) => m.editMessage(channel.id, message.id, $({
                    content: '{"title":false}',
                    embeds: message.embeds
                }))).resolves(message);
            }
        },
        {
            code: '{edit;9876543212345678;12345678901234567;_delete}',
            expected: '',
            setup(ctx) {
                ctx.channels.general.id = '9876543212345678';
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.local.message.channel.guild.channels.get('9876543212345678') as eris.KnownGuildTextableChannel;
                assert.notEqual(channel, undefined);
                assert.notEqual(channel, null);
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, channel.id)).resolves([channel]);
                ctx.util.setup(m => m.getMessage(channel, '12345678901234567', false)).resolves(message);
                ctx.discord.setup((m, $) => m.editMessage(channel.id, message.id, $({
                    content: '',
                    embeds: message.embeds
                }))).resolves(message);
            }
        },
        {
            code: '{edit;9876543212345678;12345678901234567;New message text;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.channels.general.id = '9876543212345678';
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.local.message.channel.guild.channels.get('9876543212345678') as eris.KnownGuildTextableChannel;
                assert.notEqual(channel, undefined);
                assert.notEqual(channel, null);
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot));

                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, channel.id)).resolves([channel]);
                ctx.util.setup(m => m.getMessage(channel, '12345678901234567', false)).resolves(message);
                ctx.discord.setup((m, $) => m.editMessage(channel.id, message.id, $({
                    content: 'New message text',
                    embeds: [{ title: 'New embed!' }]
                }))).resolves(message);
            }
        },
        {
            title: 'When no channel is found',
            code: '{edit;9876543212345678;12345678901234567;New message text;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '`No channel found`',
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findChannels(bbctx.local.message.channel.guild, '9876543212345678')).resolves([]);
            },
            errors: [
                { start: 0, end: 95, error: new ChannelNotFoundError('9876543212345678') }
            ]
        }
    ]
});
