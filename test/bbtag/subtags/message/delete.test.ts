import assert from 'node:assert/strict';

import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '@blargbot/bbtag';
import type { IsUserStaffThunk } from '@blargbot/bbtag/subtags';
import { DeleteSubtag, IsStaffSubtag } from '@blargbot/bbtag/subtags';
import type { Logger } from '@blargbot/logger';
import { Mock } from '@blargbot/test-util';
import type * as eris from 'eris';

import { runSubtagTests, SubtagTestContext } from '../SubtagTestSuite.js';

const logger = new Mock<Logger>({ id: 'logger' });
const isUserStaff = new Mock<IsUserStaffThunk>({ id: 'isUserStaff', callable: true });

await runSubtagTests({
    subtag: new DeleteSubtag({
        logger: logger.instance
    }),
    argCountBounds: { min: 0, max: 2 },
    names: ['delete'],
    otherSubtags: [
        new IsStaffSubtag({
            isUserStaff: isUserStaff.instance
        })
    ],
    setup(ctx) {
        ctx.adoptMock(logger);
        ctx.adoptMock(isUserStaff);
    },
    cases: [
        {
            code: '{delete}',
            expected: '',
            setup(ctx) {
                ctx.discord.setup(m => m.deleteMessage(ctx.channels.command.id, ctx.message.id, undefined)).resolves();
            }
        },
        {
            title: 'When the delete fails',
            code: '{delete}',
            expected: '',
            setup(ctx) {
                const error = new Error();
                ctx.discord.setup(m => m.deleteMessage(ctx.channels.command.id, ctx.message.id, undefined)).rejects(error);
                logger.setup(m => m.warn('Failed to delete message', error)).returns();
            }
        },
        {
            title: 'When the current message id is given',
            code: '{delete;1234567890123456}',
            expected: '',
            setup(ctx) {
                ctx.message.id = '1234567890123456';
                ctx.discord.setup(m => m.deleteMessage(ctx.channels.command.id, ctx.message.id, undefined)).resolves();
            }
        },
        {
            title: 'When the command user is not staff and the message isnt owned by the current command',
            code: '{delete;1234567890123456}',
            expected: '`Author must be staff to delete unrelated messages`',
            errors: [
                { error: new BBTagRuntimeError('Author must be staff to delete unrelated messages') }
            ],
            setup(ctx) {
                isUserStaff.setup(m => m(ctx.guild.id, ctx.users.authorizer.id)).resolves(false).mustHappen(1);
            }
        },
        {
            title: 'When the user isnt staff, but the message is owned by the current command',
            code: '{delete;1234567890123456}',
            expected: '',
            setup(ctx) {
                ctx.ownedMessages.push('1234567890123456');
                ctx.discord.setup(m => m.deleteMessage(ctx.channels.command.id, '1234567890123456', undefined)).resolves();
            },
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: ctx.channels.command.id,
                    id: '1234567890123456'
                }, ctx.users.command));
                ctx.util.setup(m => m.getMessage(bbctx.local.message.channel, message.id, false)).resolves(message);
            }
        },
        {
            title: 'When the user is staff',
            code: '{delete;1234567890123456}',
            expected: '',
            setup(ctx) {
                isUserStaff.setup(m => m(ctx.guild.id, ctx.users.authorizer.id)).resolves(true).mustHappen(1);
                ctx.discord.setup(m => m.deleteMessage(ctx.channels.command.id, '1234567890123456', undefined)).resolves();
            },
            postSetup(bbctx, ctx) {
                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: ctx.channels.command.id,
                    id: '1234567890123456'
                }, ctx.users.command));
                ctx.util.setup(m => m.getMessage(bbctx.local.message.channel, message.id, false)).resolves(message);
            }
        },
        {
            title: 'When the user is staff',
            code: '{delete;}',
            expected: '',
            errors: [
                { error: new MessageNotFoundError('9876543212345678', '').withDisplay('') }
            ],
            setup(ctx) {
                isUserStaff.setup(m => m(ctx.guild.id, ctx.users.authorizer.id)).resolves(true).mustHappen(1);
                ctx.message.channel_id = ctx.channels.command.id = '9876543212345678';
            }
        },
        {
            title: 'When the message is not found',
            code: '{delete;1234567890123456}',
            expected: '',
            errors: [
                { error: new MessageNotFoundError('9876543212345678', '1234567890123456').withDisplay('') }
            ],
            setup(ctx) {
                isUserStaff.setup(m => m(ctx.guild.id, ctx.users.authorizer.id)).resolves(true).mustHappen(1);
                ctx.message.channel_id = ctx.channels.command.id = '9876543212345678';
            },
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.getMessage(bbctx.local.message.channel, '1234567890123456', false)).resolves(undefined);
            }
        },
        {
            title: 'When the current message & channel id is given',
            code: '{delete;987654322123456142;1234567890123456}',
            expected: '',
            setup(ctx) {
                ctx.message.id = '1234567890123456';
                ctx.message.channel_id = ctx.channels.command.id = '987654322123456142';
                ctx.discord.setup(m => m.deleteMessage(ctx.channels.command.id, ctx.message.id, undefined)).resolves();
            }
        },
        {
            title: 'When the command user is not staff and the message isnt owned by the current command',
            code: '{delete;987654322123456142;1234567890123456}',
            expected: '`Author must be staff to delete unrelated messages`',
            errors: [
                { error: new BBTagRuntimeError('Author must be staff to delete unrelated messages') }
            ],
            setup(ctx) {
                isUserStaff.setup(m => m(ctx.guild.id, ctx.users.authorizer.id)).resolves(false).mustHappen(1);
            }
        },
        {
            title: 'When the user isnt staff, but the message is owned by the current command',
            code: '{delete;987654322123456142;1234567890123456}',
            expected: '',
            setup(ctx) {
                ctx.channels.general.id = '987654322123456142';
                ctx.ownedMessages.push('1234567890123456');

            },
            postSetup(bbctx, ctx) {
                const channel = bbctx.root.message.channel.guild.channels.get('987654322123456142') as eris.KnownGuildChannel;
                assert.notEqual(channel, undefined);

                const message = ctx.createMessage(SubtagTestContext.createApiMessage({
                    channel_id: '987654322123456142',
                    id: '1234567890123456'
                }, ctx.users.command));

                ctx.util.setup(m => m.findChannels(bbctx.root.message.channel.guild, '987654322123456142')).resolves([channel]);
                ctx.util.setup(m => m.getMessage(channel, message.id, false)).resolves(message);
                ctx.discord.setup(m => m.deleteMessage(channel.id, '1234567890123456', undefined)).resolves();
            }
        },
        {
            title: 'When the channel isnt found',
            code: '{delete;987654322123456142;1234567890123456}',
            expected: '`No channel found`',
            errors: [
                { error: new ChannelNotFoundError('987654322123456142') }
            ],
            setup(ctx) {
                isUserStaff.setup(m => m(ctx.guild.id, ctx.users.authorizer.id)).resolves(true).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.findChannels(bbctx.root.message.channel.guild, '987654322123456142')).resolves([]);
            }
        }
    ]
});
