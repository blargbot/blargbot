import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '@blargbot/bbtag/errors';
import { EditSubtag } from '@blargbot/bbtag/subtags/message/edit';
import { EscapeBBTagSubtag } from '@blargbot/bbtag/subtags/misc/escapeBBTag';
import { argument } from '@blargbot/test-util/mock';
import { expect } from 'chai';
import { KnownGuildTextableChannel } from 'eris';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new EditSubtag(),
    argCountBounds: { min: 2, max: 4 },
    cases: [
        {
            title: 'When the message cannot be found',
            code: '{edit;12345678901234567;New message text}',
            expected: '`No message found`',
            setup(ctx) {
                ctx.message.channel_id = ctx.channels.command.id = '987654321123456789';
            },
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.getMessage(bbctx.channel, '12345678901234567', false)).thenResolve(undefined);
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
                    channel_id: bbctx.channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.command));

                ctx.util.setup(m => m.getMessage(bbctx.channel, '12345678901234567', false)).thenResolve(message);
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
                    channel_id: bbctx.channel.id,
                    id: '12345678901234567',
                    content: 'Original message text'
                }, ctx.users.bot));

                ctx.util.setup(m => m.getMessage(bbctx.channel, '12345678901234567', false)).thenResolve(message);
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
                    channel_id: bbctx.channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot));

                ctx.util.setup(m => m.getMessage(bbctx.channel, '12345678901234567', false)).thenResolve(message);
                ctx.discord.setup(m => m.editMessage(bbctx.channel.id, message.id, argument.isDeepEqual({
                    content: 'New message text',
                    embeds: argument.exact(message.embeds)
                }))).thenResolve(message);
            }
        },
        {
            code: '{edit;12345678901234567;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: bbctx.channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot));

                ctx.util.setup(m => m.getMessage(bbctx.channel, '12345678901234567', false)).thenResolve(message);
                ctx.discord.setup(m => m.editMessage(bbctx.channel.id, message.id, argument.isDeepEqual({
                    content: 'Original message text',
                    embeds: [{ title: 'New embed!' }]
                }))).thenResolve(message);
            }
        },
        {
            code: '{edit;12345678901234567;{escapebbtag;{"title":false}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: bbctx.channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot));

                ctx.util.setup(m => m.getMessage(bbctx.channel, '12345678901234567', false)).thenResolve(message);
                ctx.discord.setup(m => m.editMessage(bbctx.channel.id, message.id, argument.isDeepEqual({
                    content: '{"title":false}',
                    embeds: argument.exact(message.embeds)
                }))).thenResolve(message);
            }
        },
        {
            code: '{edit;12345678901234567;_delete}',
            expected: '',
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: bbctx.channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot));

                ctx.util.setup(m => m.getMessage(bbctx.channel, '12345678901234567', false)).thenResolve(message);
                ctx.discord.setup(m => m.editMessage(bbctx.channel.id, message.id, argument.isDeepEqual({
                    content: '',
                    embeds: argument.exact(message.embeds)
                }))).thenResolve(message);
            }
        },
        {
            code: '{edit;12345678901234567;New message text;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: bbctx.channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot));

                ctx.util.setup(m => m.findChannels(bbctx.guild, '12345678901234567')).thenResolve([]);
                ctx.util.setup(m => m.getMessage(bbctx.channel, '12345678901234567', false)).thenResolve(message);
                ctx.discord.setup(m => m.editMessage(bbctx.channel.id, message.id, argument.isDeepEqual({
                    content: 'New message text',
                    embeds: [{ title: 'New embed!' }]
                }))).thenResolve(message);
            }
        },
        {
            code: '{edit;12345678901234567;{escapebbtag;{"title":"New embed!"}};New message text}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: bbctx.channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot));

                ctx.util.setup(m => m.findChannels(bbctx.guild, '12345678901234567')).thenResolve([]);
                ctx.util.setup(m => m.getMessage(bbctx.channel, '12345678901234567', false)).thenResolve(message);
                ctx.discord.setup(m => m.editMessage(bbctx.channel.id, message.id, argument.isDeepEqual({
                    content: '{"title":"New embed!"}',
                    embeds: [{ fields: [{ name: 'Malformed JSON', value: '"New message text"' }], malformed: true }]
                }))).thenResolve(message);
            }
        },
        {
            title: 'When the message is empty',
            code: '{edit;12345678901234567;_delete;_delete}',
            expected: '`Message cannot be empty`',
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: bbctx.channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot));

                ctx.util.setup(m => m.findChannels(bbctx.guild, '12345678901234567')).thenResolve([]);
                ctx.util.setup(m => m.getMessage(bbctx.channel, '12345678901234567', false)).thenResolve(message);
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
                const channel = bbctx.guild.channels.get('9876543212345678') as KnownGuildTextableChannel;
                expect(channel).to.not.be.undefined.and.not.be.null;
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot));

                ctx.util.setup(m => m.findChannels(bbctx.guild, channel.id)).thenResolve([channel]);
                ctx.util.setup(m => m.getMessage(channel, '12345678901234567', false)).thenResolve(message);
                ctx.discord.setup(m => m.editMessage(channel.id, message.id, argument.isDeepEqual({
                    content: 'New message text',
                    embeds: argument.exact(message.embeds)
                }))).thenResolve(message);
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
                const channel = bbctx.guild.channels.get('9876543212345678') as KnownGuildTextableChannel;
                expect(channel).to.not.be.undefined.and.not.be.null;
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot));

                ctx.util.setup(m => m.findChannels(bbctx.guild, channel.id)).thenResolve([channel]);
                ctx.util.setup(m => m.getMessage(channel, '12345678901234567', false)).thenResolve(message);
                ctx.discord.setup(m => m.editMessage(channel.id, message.id, argument.isDeepEqual({
                    content: 'Original message text',
                    embeds: [{ title: 'New embed!' }]
                }))).thenResolve(message);
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
                const channel = bbctx.guild.channels.get('9876543212345678') as KnownGuildTextableChannel;
                expect(channel).to.not.be.undefined.and.not.be.null;
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot));

                ctx.util.setup(m => m.findChannels(bbctx.guild, channel.id)).thenResolve([channel]);
                ctx.util.setup(m => m.getMessage(channel, '12345678901234567', false)).thenResolve(message);
                ctx.discord.setup(m => m.editMessage(channel.id, message.id, argument.isDeepEqual({
                    content: '{"title":false}',
                    embeds: argument.exact(message.embeds)
                }))).thenResolve(message);
            }
        },
        {
            code: '{edit;9876543212345678;12345678901234567;_delete}',
            expected: '',
            setup(ctx) {
                ctx.channels.general.id = '9876543212345678';
            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.guild.channels.get('9876543212345678') as KnownGuildTextableChannel;
                expect(channel).to.not.be.undefined.and.not.be.null;
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot));

                ctx.util.setup(m => m.findChannels(bbctx.guild, channel.id)).thenResolve([channel]);
                ctx.util.setup(m => m.getMessage(channel, '12345678901234567', false)).thenResolve(message);
                ctx.discord.setup(m => m.editMessage(channel.id, message.id, argument.isDeepEqual({
                    content: '',
                    embeds: argument.exact(message.embeds)
                }))).thenResolve(message);
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
                const channel = bbctx.guild.channels.get('9876543212345678') as KnownGuildTextableChannel;
                expect(channel).to.not.be.undefined.and.not.be.null;
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot));

                ctx.util.setup(m => m.findChannels(bbctx.guild, channel.id)).thenResolve([channel]);
                ctx.util.setup(m => m.getMessage(channel, '12345678901234567', false)).thenResolve(message);
                ctx.discord.setup(m => m.editMessage(channel.id, message.id, argument.isDeepEqual({
                    content: 'New message text',
                    embeds: [{ title: 'New embed!' }]
                }))).thenResolve(message);
            }
        },
        {
            title: 'When no channel is found',
            code: '{edit;9876543212345678;12345678901234567;New message text;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '`No channel found`',
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findChannels(bbctx.guild, '9876543212345678')).thenResolve([]);
            },
            errors: [
                { start: 0, end: 95, error: new ChannelNotFoundError('9876543212345678') }
            ]
        }
    ]
});
