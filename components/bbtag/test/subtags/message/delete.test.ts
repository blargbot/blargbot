import { Subtag } from '@blargbot/bbtag';
import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '@blargbot/bbtag/errors/index.js';
import { DeleteSubtag } from '@blargbot/bbtag/subtags/message/delete.js';
import chai from 'chai';
import type * as Eris from 'eris';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(DeleteSubtag),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        {
            code: '{delete}',
            expected: '',
            setup(ctx) {
                ctx.isStaff = false;
                ctx.discord.setup(m => m.deleteMessage(ctx.channels.command.id, ctx.message.id, undefined)).thenResolve();
            }
        },
        {
            title: 'When the delete fails',
            code: '{delete}',
            expected: '',
            setup(ctx) {
                const error = new Error();

                ctx.isStaff = false;
                ctx.discord.setup(m => m.deleteMessage(ctx.channels.command.id, ctx.message.id, undefined)).thenReject(error);
                ctx.logger.setup(m => m.warn('Failed to delete message', error)).thenReturn();
            }
        },
        {
            title: 'When the current message id is given',
            code: '{delete;1234567890123456}',
            expected: '',
            setup(ctx) {
                ctx.message.id = '1234567890123456';
                ctx.isStaff = false;
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
                ctx.isStaff = false;
                ctx.ownedMessages.push('1234567890123456');

                ctx.discord.setup(m => m.deleteMessage(ctx.channels.command.id, '1234567890123456', undefined)).thenResolve();
            },
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: ctx.channels.command.id,
                    id: '1234567890123456'
                }, ctx.users.command));

                ctx.util.setup(m => m.getMessage(bbctx.channel, message.id, false)).thenResolve(message);
            }
        },
        {
            title: 'When the user is staff',
            code: '{delete;1234567890123456}',
            expected: '',
            setup(ctx) {
                ctx.isStaff = true;

                ctx.discord.setup(m => m.deleteMessage(ctx.channels.command.id, '1234567890123456', undefined)).thenResolve();
            },
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: ctx.channels.command.id,
                    id: '1234567890123456'
                }, ctx.users.command));

                ctx.util.setup(m => m.getMessage(bbctx.channel, message.id, false)).thenResolve(message);
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
                ctx.util.setup(m => m.getMessage(bbctx.channel, '1234567890123456', false)).thenResolve(undefined);
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
                ctx.message.id = '1234567890123456';
                ctx.message.channel_id = ctx.channels.command.id = '987654322123456142';
                ctx.isStaff = false;
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
                const channel = bbctx.guild.channels.get('987654322123456142') as Eris.KnownGuildChannel;
                chai.expect(channel).to.not.be.undefined;

                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: '987654322123456142',
                    id: '1234567890123456'
                }, ctx.users.command));

                ctx.util.setup(m => m.findChannels(bbctx.guild, '987654322123456142')).thenResolve([channel]);
                ctx.util.setup(m => m.getMessage(channel, message.id, false)).thenResolve(message);
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
