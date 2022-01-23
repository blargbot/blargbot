import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '@cluster/bbtag/errors';
import { AggregateCommandManager } from '@cluster/managers';
import { DeleteSubtag } from '@cluster/subtags/message/delete';
import { MessageIdQueue } from '@core/MessageIdQueue';
import { expect } from 'chai';
import { KnownGuildChannel } from 'eris';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new DeleteSubtag(),
    cases: [
        {
            code: '{delete}',
            expected: '',
            setup(ctx) {
                const commandManager = ctx.createMock(AggregateCommandManager);
                const messageIdQueue = ctx.createMock(MessageIdQueue);

                ctx.isStaff = false;
                ctx.cluster.setup(m => m.commands).thenReturn(commandManager.instance);
                commandManager.setup(m => m.messages).thenReturn(messageIdQueue.instance);
                messageIdQueue.setup(m => m.remove(ctx.guild.id, ctx.message.id)).thenReturn(true);
                ctx.discord.setup(m => m.deleteMessage(ctx.channels.command.id, ctx.message.id, undefined)).thenResolve();
            }
        },
        {
            title: 'When the delete fails',
            code: '{delete}',
            expected: '',
            setup(ctx) {
                const commandManager = ctx.createMock(AggregateCommandManager);
                const messageIdQueue = ctx.createMock(MessageIdQueue);
                const error = new Error();

                ctx.isStaff = false;
                ctx.cluster.setup(m => m.commands).thenReturn(commandManager.instance);
                commandManager.setup(m => m.messages).thenReturn(messageIdQueue.instance);
                messageIdQueue.setup(m => m.remove(ctx.guild.id, ctx.message.id)).thenReturn(true);
                ctx.discord.setup(m => m.deleteMessage(ctx.channels.command.id, ctx.message.id, undefined)).thenReject(error);
                ctx.logger.setup(m => m.warn('Failed to delete message', error)).thenReturn();
            }
        },
        {
            title: 'When the current message id is given',
            code: '{delete;1234567890123456}',
            expected: '',
            setup(ctx) {
                const commandManager = ctx.createMock(AggregateCommandManager);
                const messageIdQueue = ctx.createMock(MessageIdQueue);

                ctx.message.id = '1234567890123456';
                ctx.isStaff = false;
                ctx.cluster.setup(m => m.commands).thenReturn(commandManager.instance);
                commandManager.setup(m => m.messages).thenReturn(messageIdQueue.instance);
                messageIdQueue.setup(m => m.remove(ctx.guild.id, ctx.message.id)).thenReturn(true);
                ctx.discord.setup(m => m.deleteMessage(ctx.channels.command.id, ctx.message.id, undefined)).thenResolve();
            }
        },
        {
            title: 'When the command user is not staff and the message isnt owned by the current command',
            code: '{delete;1234567890123456}',
            expected: '`Author must be staff to delete unrelated messages`',
            errors: [
                { start: 0, end: 25, error: new BBTagRuntimeError('Author must be staff to delete unrelated messages') }
            ],
            setup(ctx) {
                ctx.isStaff = false;
            }
        },
        {
            title: 'When the user isnt staff, but the message is owned by the current command',
            code: '{delete;1234567890123456}',
            expected: '',
            setup(ctx) {
                const commandManager = ctx.createMock(AggregateCommandManager);
                const messageIdQueue = ctx.createMock(MessageIdQueue);

                ctx.isStaff = false;
                ctx.ownedMessages.push('1234567890123456');

                ctx.cluster.setup(m => m.commands).thenReturn(commandManager.instance);
                commandManager.setup(m => m.messages).thenReturn(messageIdQueue.instance);
                messageIdQueue.setup(m => m.remove(ctx.guild.id, '1234567890123456')).thenReturn(true);
                ctx.discord.setup(m => m.deleteMessage(ctx.channels.command.id, '1234567890123456', undefined)).thenResolve();
            },
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: ctx.channels.command.id,
                    id: '1234567890123456'
                }, ctx.users.command));

                ctx.util.setup(m => m.getMessage(bbctx.channel, message.id)).thenResolve(message);
            }
        },
        {
            title: 'When the user is staff',
            code: '{delete;1234567890123456}',
            expected: '',
            setup(ctx) {
                const commandManager = ctx.createMock(AggregateCommandManager);
                const messageIdQueue = ctx.createMock(MessageIdQueue);

                ctx.isStaff = true;

                ctx.cluster.setup(m => m.commands).thenReturn(commandManager.instance);
                commandManager.setup(m => m.messages).thenReturn(messageIdQueue.instance);
                messageIdQueue.setup(m => m.remove(ctx.guild.id, '1234567890123456')).thenReturn(true);
                ctx.discord.setup(m => m.deleteMessage(ctx.channels.command.id, '1234567890123456', undefined)).thenResolve();
            },
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: ctx.channels.command.id,
                    id: '1234567890123456'
                }, ctx.users.command));

                ctx.util.setup(m => m.getMessage(bbctx.channel, message.id)).thenResolve(message);
            }
        },
        {
            title: 'When the user is staff',
            code: '{delete;}',
            expected: '',
            setup(ctx) {
                ctx.isStaff = true;
                ctx.message.channel_id = ctx.channels.command.id = '9876543212345678';
            },
            errors: [
                { start: 0, end: 9, error: new MessageNotFoundError('9876543212345678', '').withDisplay('') }
            ]
        },
        {
            title: 'When the message is not found',
            code: '{delete;1234567890123456}',
            expected: '',
            setup(ctx) {
                ctx.isStaff = true;
                ctx.message.channel_id = ctx.channels.command.id = '9876543212345678';
            },
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.getMessage(bbctx.channel, '1234567890123456')).thenResolve(undefined);
            },
            errors: [
                { start: 0, end: 25, error: new MessageNotFoundError('9876543212345678', '1234567890123456').withDisplay('') }
            ]
        },
        {
            title: 'When the current message & channel id is given',
            code: '{delete;987654322123456142;1234567890123456}',
            expected: '',
            setup(ctx) {
                const commandManager = ctx.createMock(AggregateCommandManager);
                const messageIdQueue = ctx.createMock(MessageIdQueue);

                ctx.message.id = '1234567890123456';
                ctx.message.channel_id = ctx.channels.command.id = '987654322123456142';
                ctx.isStaff = false;
                ctx.cluster.setup(m => m.commands).thenReturn(commandManager.instance);
                commandManager.setup(m => m.messages).thenReturn(messageIdQueue.instance);
                messageIdQueue.setup(m => m.remove(ctx.guild.id, ctx.message.id)).thenReturn(true);
                ctx.discord.setup(m => m.deleteMessage(ctx.channels.command.id, ctx.message.id, undefined)).thenResolve();
            }
        },
        {
            title: 'When the command user is not staff and the message isnt owned by the current command',
            code: '{delete;987654322123456142;1234567890123456}',
            expected: '`Author must be staff to delete unrelated messages`',
            errors: [
                { start: 0, end: 44, error: new BBTagRuntimeError('Author must be staff to delete unrelated messages') }
            ],
            setup(ctx) {
                ctx.isStaff = false;
            }
        },
        {
            title: 'When the user isnt staff, but the message is owned by the current command',
            code: '{delete;987654322123456142;1234567890123456}',
            expected: '',
            setup(ctx) {
                ctx.channels.general.id = '987654322123456142';
                ctx.isStaff = false;
                ctx.ownedMessages.push('1234567890123456');

            },
            postSetup(bbctx, ctx) {
                const commandManager = ctx.createMock(AggregateCommandManager);
                const messageIdQueue = ctx.createMock(MessageIdQueue);
                const channel = bbctx.guild.channels.get('987654322123456142') as KnownGuildChannel;
                expect(channel).to.not.be.undefined;

                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: '987654322123456142',
                    id: '1234567890123456'
                }, ctx.users.command));

                ctx.util.setup(m => m.findChannels(bbctx.guild, '987654322123456142')).thenResolve([channel]);
                ctx.util.setup(m => m.getMessage(channel, message.id)).thenResolve(message);
                ctx.cluster.setup(m => m.commands).thenReturn(commandManager.instance);
                commandManager.setup(m => m.messages).thenReturn(messageIdQueue.instance);
                messageIdQueue.setup(m => m.remove(ctx.guild.id, '1234567890123456')).thenReturn(true);
                ctx.discord.setup(m => m.deleteMessage(channel.id, '1234567890123456', undefined)).thenResolve();
            }
        },
        {
            title: 'When the channel isnt found',
            code: '{delete;987654322123456142;1234567890123456}',
            expected: '`No channel found`',
            setup(ctx) {
                ctx.isStaff = true;
            },
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findChannels(bbctx.guild, '987654322123456142')).thenResolve([]);
            },
            errors: [
                { start: 0, end: 44, error: new ChannelNotFoundError('987654322123456142') }
            ]
        }
    ]
});
