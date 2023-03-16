import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError, Subtag } from '@bbtag/blargbot';
import { DeleteSubtag } from '@bbtag/blargbot/subtags';
import chai from 'chai';

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
            },
            postSetup(bbctx, ctx) {
                ctx.dependencies.messages.setup(m => m.delete(bbctx.runtime, ctx.channels.command.id, ctx.message.id)).thenResolve();
            }
        },
        {
            title: 'When the current message id is given',
            code: '{delete;1234567890123456}',
            expected: '',
            setup(ctx) {
                ctx.message.id = '1234567890123456';
                ctx.isStaff = false;
            },
            postSetup(bbctx, ctx) {
                ctx.dependencies.messages.setup(m => m.delete(bbctx.runtime, ctx.channels.command.id, ctx.message.id)).thenResolve();
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
            },
            postSetup(bbctx, ctx) {
                const message = SubtagTestContext.createMessage({
                    channel_id: ctx.channels.command.id,
                    id: '1234567890123456'
                }, ctx.users.command);

                ctx.dependencies.messages.setup(m => m.get(bbctx.runtime, bbctx.runtime.channel.id, message.id)).thenResolve(message);
                ctx.dependencies.messages.setup(m => m.delete(bbctx.runtime, ctx.channels.command.id, '1234567890123456')).thenResolve();
            }
        },
        {
            title: 'When the user is staff',
            code: '{delete;1234567890123456}',
            expected: '',
            setup(ctx) {
                ctx.isStaff = true;
            },
            postSetup(bbctx, ctx) {
                const message = SubtagTestContext.createMessage({
                    channel_id: ctx.channels.command.id,
                    id: '1234567890123456'
                }, ctx.users.command);

                ctx.dependencies.messages.setup(m => m.get(bbctx.runtime, bbctx.runtime.channel.id, message.id)).thenResolve(message);
                ctx.dependencies.messages.setup(m => m.delete(bbctx.runtime, ctx.channels.command.id, '1234567890123456')).thenResolve();
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
                ctx.dependencies.messages.setup(m => m.get(bbctx.runtime, bbctx.runtime.channel.id, '1234567890123456')).thenResolve(undefined);
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
            },
            postSetup(bbctx, ctx) {
                ctx.dependencies.messages.setup(m => m.delete(bbctx.runtime, ctx.channels.command.id, ctx.message.id)).thenResolve();
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
                const channel = ctx.channels.general;
                chai.expect(channel).to.not.be.undefined;

                const message = SubtagTestContext.createMessage({
                    channel_id: '987654322123456142',
                    id: '1234567890123456'
                }, ctx.users.command);

                ctx.dependencies.channels.setup(m => m.querySingle(bbctx.runtime, '987654322123456142')).thenResolve(channel);
                ctx.dependencies.messages.setup(m => m.get(bbctx.runtime, channel.id, message.id)).thenResolve(message);
                ctx.dependencies.messages.setup(m => m.delete(bbctx.runtime, channel.id, '1234567890123456')).thenResolve();
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
                ctx.dependencies.channels.setup(m => m.querySingle(bbctx.runtime, '987654322123456142')).thenResolve(undefined);
            },
            errors: [
                { start: 0, end: 44, error: new ChannelNotFoundError('987654322123456142') }
            ]
        }
    ]
});
