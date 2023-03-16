import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError, Subtag } from '@bbtag/blargbot';
import { EditSubtag, EscapeBBTagSubtag } from '@bbtag/blargbot/subtags';
import { argument } from '@blargbot/test-util/mock.js';
import chai from 'chai';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(EditSubtag),
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
                ctx.dependencies.messages.setup(m => m.get(bbctx.runtime, bbctx.runtime.channel.id, '12345678901234567')).thenResolve(undefined);
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
                const message = SubtagTestContext.createMessage({
                    channel_id: bbctx.runtime.channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.command);

                ctx.dependencies.messages.setup(m => m.get(bbctx.runtime, bbctx.runtime.channel.id, '12345678901234567')).thenResolve(message);
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
                const message = SubtagTestContext.createMessage({
                    channel_id: bbctx.runtime.channel.id,
                    id: '12345678901234567',
                    content: 'Original message text'
                }, ctx.users.bot);

                ctx.dependencies.messages.setup(m => m.get(bbctx.runtime, bbctx.runtime.channel.id, '12345678901234567')).thenResolve(message);
            },
            errors: [
                { start: 0, end: 32, error: new BBTagRuntimeError('Message cannot be empty') }
            ]
        },
        {
            code: '{edit;12345678901234567;New message text}',
            expected: '',
            postSetup(bbctx, ctx) {
                const message = SubtagTestContext.createMessage({
                    channel_id: bbctx.runtime.channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot);

                ctx.dependencies.messages.setup(m => m.get(bbctx.runtime, bbctx.runtime.channel.id, '12345678901234567')).thenResolve(message);
                ctx.dependencies.messages.setup(m => m.edit(bbctx.runtime, bbctx.runtime.channel.id, message.id, argument.isDeepEqual({
                    content: 'New message text',
                    embeds: argument.exact(message.embeds)
                }))).thenResolve();
            }
        },
        {
            code: '{edit;12345678901234567;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '',
            postSetup(bbctx, ctx) {
                const message = SubtagTestContext.createMessage({
                    channel_id: bbctx.runtime.channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot);

                ctx.dependencies.messages.setup(m => m.get(bbctx.runtime, bbctx.runtime.channel.id, '12345678901234567')).thenResolve(message);
                ctx.dependencies.messages.setup(m => m.edit(bbctx.runtime, bbctx.runtime.channel.id, message.id, argument.isDeepEqual({
                    content: 'Original message text',
                    embeds: [{ title: 'New embed!' }]
                }))).thenResolve();
            }
        },
        {
            code: '{edit;12345678901234567;{escapebbtag;{"title":false}}}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '',
            postSetup(bbctx, ctx) {
                const message = SubtagTestContext.createMessage({
                    channel_id: bbctx.runtime.channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot);

                ctx.dependencies.messages.setup(m => m.get(bbctx.runtime, bbctx.runtime.channel.id, '12345678901234567')).thenResolve(message);
                ctx.dependencies.messages.setup(m => m.edit(bbctx.runtime, bbctx.runtime.channel.id, message.id, argument.isDeepEqual({
                    content: '{"title":false}',
                    embeds: argument.exact(message.embeds)
                }))).thenResolve();
            }
        },
        {
            code: '{edit;12345678901234567;_delete}',
            expected: '',
            postSetup(bbctx, ctx) {
                const message = SubtagTestContext.createMessage({
                    channel_id: bbctx.runtime.channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot);

                ctx.dependencies.messages.setup(m => m.get(bbctx.runtime, bbctx.runtime.channel.id, '12345678901234567')).thenResolve(message);
                ctx.dependencies.messages.setup(m => m.edit(bbctx.runtime, bbctx.runtime.channel.id, message.id, argument.isDeepEqual({
                    content: '',
                    embeds: argument.exact(message.embeds)
                }))).thenResolve();
            }
        },
        {
            code: '{edit;12345678901234567;New message text;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '',
            postSetup(bbctx, ctx) {
                const message = SubtagTestContext.createMessage({
                    channel_id: bbctx.runtime.channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot);

                ctx.dependencies.channels.setup(m => m.querySingle(bbctx.runtime, '12345678901234567', argument.isDeepEqual({ noLookup: true }))).thenResolve(undefined);
                ctx.dependencies.messages.setup(m => m.get(bbctx.runtime, bbctx.runtime.channel.id, '12345678901234567')).thenResolve(message);
                ctx.dependencies.messages.setup(m => m.edit(bbctx.runtime, bbctx.runtime.channel.id, message.id, argument.isDeepEqual({
                    content: 'New message text',
                    embeds: [{ title: 'New embed!' }]
                }))).thenResolve();
            }
        },
        {
            code: '{edit;12345678901234567;{escapebbtag;{"title":"New embed!"}};New message text}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '',
            postSetup(bbctx, ctx) {
                const message = SubtagTestContext.createMessage({
                    channel_id: bbctx.runtime.channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot);

                ctx.dependencies.channels.setup(m => m.querySingle(bbctx.runtime, '12345678901234567', argument.isDeepEqual({ noLookup: true }))).thenResolve(undefined);
                ctx.dependencies.messages.setup(m => m.get(bbctx.runtime, bbctx.runtime.channel.id, '12345678901234567')).thenResolve(message);
                ctx.dependencies.messages.setup(m => m.edit(bbctx.runtime, bbctx.runtime.channel.id, message.id, argument.isDeepEqual({
                    content: '{"title":"New embed!"}',
                    embeds: [{ fields: [{ name: 'Malformed JSON', value: '"New message text"' }] }]
                }))).thenResolve();
            }
        },
        {
            title: 'When the message is empty',
            code: '{edit;12345678901234567;_delete;_delete}',
            expected: '`Message cannot be empty`',
            postSetup(bbctx, ctx) {
                const message = SubtagTestContext.createMessage({
                    channel_id: bbctx.runtime.channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot);

                ctx.dependencies.channels.setup(m => m.querySingle(bbctx.runtime, '12345678901234567', argument.isDeepEqual({ noLookup: true }))).thenResolve(undefined);
                ctx.dependencies.messages.setup(m => m.get(bbctx.runtime, bbctx.runtime.channel.id, '12345678901234567')).thenResolve(message);
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
                const channel = ctx.channels.general;
                chai.expect(channel).to.not.be.undefined.and.not.be.null;
                const message = SubtagTestContext.createMessage({
                    channel_id: channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot);

                ctx.dependencies.channels.setup(m => m.querySingle(bbctx.runtime, channel.id, argument.isDeepEqual({ noLookup: true }))).thenResolve(channel);
                ctx.dependencies.messages.setup(m => m.get(bbctx.runtime, channel.id, '12345678901234567')).thenResolve(message);
                ctx.dependencies.messages.setup(m => m.edit(bbctx.runtime, channel.id, message.id, argument.isDeepEqual({
                    content: 'New message text',
                    embeds: argument.exact(message.embeds)
                }))).thenResolve();
            }
        },
        {
            code: '{edit;9876543212345678;12345678901234567;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '',
            setup(ctx) {
                ctx.channels.general.id = '9876543212345678';
            },
            postSetup(bbctx, ctx) {
                const channel = ctx.channels.general;
                chai.expect(channel).to.not.be.undefined.and.not.be.null;
                const message = SubtagTestContext.createMessage({
                    channel_id: channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot);

                ctx.dependencies.channels.setup(m => m.querySingle(bbctx.runtime, channel.id, argument.isDeepEqual({ noLookup: true }))).thenResolve(channel);
                ctx.dependencies.messages.setup(m => m.get(bbctx.runtime, channel.id, '12345678901234567')).thenResolve(message);
                ctx.dependencies.messages.setup(m => m.edit(bbctx.runtime, channel.id, message.id, argument.isDeepEqual({
                    content: 'Original message text',
                    embeds: [{ title: 'New embed!' }]
                }))).thenResolve();
            }
        },
        {
            code: '{edit;9876543212345678;12345678901234567;{escapebbtag;{"title":false}}}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '',
            setup(ctx) {
                ctx.channels.general.id = '9876543212345678';
            },
            postSetup(bbctx, ctx) {
                const channel = ctx.channels.general;
                chai.expect(channel).to.not.be.undefined.and.not.be.null;
                const message = SubtagTestContext.createMessage({
                    channel_id: channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot);

                ctx.dependencies.channels.setup(m => m.querySingle(bbctx.runtime, channel.id, argument.isDeepEqual({ noLookup: true }))).thenResolve(channel);
                ctx.dependencies.messages.setup(m => m.get(bbctx.runtime, channel.id, '12345678901234567')).thenResolve(message);
                ctx.dependencies.messages.setup(m => m.edit(bbctx.runtime, channel.id, message.id, argument.isDeepEqual({
                    content: '{"title":false}',
                    embeds: argument.exact(message.embeds)
                }))).thenResolve();
            }
        },
        {
            code: '{edit;9876543212345678;12345678901234567;_delete}',
            expected: '',
            setup(ctx) {
                ctx.channels.general.id = '9876543212345678';
            },
            postSetup(bbctx, ctx) {
                const channel = ctx.channels.general;
                chai.expect(channel).to.not.be.undefined.and.not.be.null;
                const message = SubtagTestContext.createMessage({
                    channel_id: channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot);

                ctx.dependencies.channels.setup(m => m.querySingle(bbctx.runtime, channel.id, argument.isDeepEqual({ noLookup: true }))).thenResolve(channel);
                ctx.dependencies.messages.setup(m => m.get(bbctx.runtime, channel.id, '12345678901234567')).thenResolve(message);
                ctx.dependencies.messages.setup(m => m.edit(bbctx.runtime, channel.id, message.id, argument.isDeepEqual({
                    content: '',
                    embeds: argument.exact(message.embeds)
                }))).thenResolve();
            }
        },
        {
            code: '{edit;9876543212345678;12345678901234567;New message text;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '',
            setup(ctx) {
                ctx.channels.general.id = '9876543212345678';
            },
            postSetup(bbctx, ctx) {
                const channel = ctx.channels.general;
                chai.expect(channel).to.not.be.undefined.and.not.be.null;
                const message = SubtagTestContext.createMessage({
                    channel_id: channel.id,
                    id: '12345678901234567',
                    content: 'Original message text',
                    embeds: [{ title: 'Original embed' }]
                }, ctx.users.bot);

                ctx.dependencies.channels.setup(m => m.querySingle(bbctx.runtime, channel.id, argument.isDeepEqual({ noLookup: true }))).thenResolve(channel);
                ctx.dependencies.messages.setup(m => m.get(bbctx.runtime, channel.id, '12345678901234567')).thenResolve(message);
                ctx.dependencies.messages.setup(m => m.edit(bbctx.runtime, channel.id, message.id, argument.isDeepEqual({
                    content: 'New message text',
                    embeds: [{ title: 'New embed!' }]
                }))).thenResolve();
            }
        },
        {
            title: 'When no channel is found',
            code: '{edit;9876543212345678;12345678901234567;New message text;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [Subtag.getDescriptor(EscapeBBTagSubtag)],
            expected: '`No channel found`',
            postSetup(bbctx, ctx) {
                ctx.dependencies.channels.setup(m => m.querySingle(bbctx.runtime, '9876543212345678', argument.isDeepEqual({ noLookup: true }))).thenResolve();
            },
            errors: [
                { start: 0, end: 95, error: new ChannelNotFoundError('9876543212345678') }
            ]
        }
    ]
});
