import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '@blargbot/bbtag';
import type { DeleteMessageFeature } from '@blargbot/bbtag/subtags';
import { ChannelIdSubtag, ChannelIsTextSubtag, DeleteSubtag, IsStaffSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const isStaffSubtag = new Mock<IsStaffSubtag>({ id: 'IsStaffSubtag' });
const channelIdSubtag = new Mock<ChannelIdSubtag>({ id: 'ChannelIdSubtag' });
const channelIsTextSubtag = new Mock<ChannelIsTextSubtag>({ id: 'ChannelIsTextSubtag' });
const features = new Mock<DeleteMessageFeature>({ id: 'features' });

await runSubtagTests({
    subtag: new DeleteSubtag(features.instance),
    argCountBounds: { min: 0, max: 2 },
    names: ['delete'],
    otherSubtags: [isStaffSubtag.instance, channelIdSubtag.instance, channelIsTextSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptSubtagMock(isStaffSubtag, { type: IsStaffSubtag });
        ctx.adoptSubtagMock(channelIdSubtag, { type: ChannelIdSubtag });
        ctx.adoptSubtagMock(channelIsTextSubtag, { type: ChannelIsTextSubtag });
    },
    cases: [
        {
            code: '{delete}',
            expected: '',
            setup(ctx) {
                features.setup(m => m.deleteMessage(ctx.channelId, ctx.messageId))
                    .resolves({ success: true })
                    .mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup(m => m.query(bbctx, ctx.channelId, undefined))
                    .resolves(ctx.channelId)
                    .mustHappen(1);
                channelIsTextSubtag.setup(m => m.check(bbctx, ctx.channelId))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            title: 'When the delete fails',
            code: '{delete}',
            expected: '',
            errors: [
                { error: new BBTagRuntimeError('Delete failed', 'Missing permissions').withDisplay('') }
            ],
            setup(ctx) {
                features.setup(m => m.deleteMessage(ctx.channelId, ctx.messageId))
                    .resolves({ success: false, cause: 'failed', reason: 'Missing permissions' })
                    .mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup(m => m.query(bbctx, ctx.channelId, undefined))
                    .resolves(ctx.channelId)
                    .mustHappen(1);
                channelIsTextSubtag.setup(m => m.check(bbctx, ctx.channelId))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            title: 'When the current message id is given',
            code: '{delete;1234567890123456}',
            expected: '',
            setup(ctx) {
                ctx.messageId = '1234567890123456';
                features.setup(m => m.deleteMessage(ctx.channelId, ctx.messageId))
                    .resolves({ success: true })
                    .mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup(m => m.query(bbctx, ctx.channelId, undefined))
                    .resolves(ctx.channelId)
                    .mustHappen(1);
                channelIsTextSubtag.setup(m => m.check(bbctx, ctx.channelId))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            title: 'When the command user is not staff and the message isnt owned by the current command',
            code: '{delete;1234567890123456}',
            expected: '`Author must be staff to delete unrelated messages`',
            errors: [
                { error: new BBTagRuntimeError('Author must be staff to delete unrelated messages') }
            ],
            postSetup(bbctx) {
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(false)
                    .mustHappen(1);
            }
        },
        {
            title: 'When the user isnt staff, but the message is owned by the current command',
            code: '{delete;1234567890123456}',
            expected: '',
            setup(ctx) {
                ctx.ownedMessages.push('1234567890123456');
                features.setup(m => m.deleteMessage(ctx.channelId, '1234567890123456'))
                    .resolves({ success: true })
                    .mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup(m => m.query(bbctx, ctx.channelId, undefined))
                    .resolves(ctx.channelId)
                    .mustHappen(1);
                channelIsTextSubtag.setup(m => m.check(bbctx, ctx.channelId))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            title: 'When the user is staff',
            code: '{delete;1234567890123456}',
            expected: '',
            setup(ctx) {
                features.setup(m => m.deleteMessage(ctx.channelId, '1234567890123456'))
                    .resolves({ success: true })
                    .mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup(m => m.query(bbctx, ctx.channelId, undefined))
                    .resolves(ctx.channelId)
                    .mustHappen(1);
                channelIsTextSubtag.setup(m => m.check(bbctx, ctx.channelId))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
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
                ctx.channelId = ctx.channelId = '9876543212345678';
            },
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup(m => m.query(bbctx, ctx.channelId, undefined))
                    .resolves(ctx.channelId)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
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
                ctx.channelId = ctx.channelId = '9876543212345678';
                features.setup(m => m.deleteMessage(ctx.channelId, '1234567890123456'))
                    .resolves({ success: false, cause: 'notFound' })
                    .mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup(m => m.query(bbctx, ctx.channelId, undefined))
                    .resolves(ctx.channelId)
                    .mustHappen(1);
                channelIsTextSubtag.setup(m => m.check(bbctx, ctx.channelId))
                    .resolves(true)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            title: 'When the current message & channel id is given',
            code: '{delete;987654322123456142;1234567890123456}',
            expected: '',
            setup(ctx) {
                ctx.messageId = '1234567890123456';
                ctx.channelId = ctx.channelId = '987654322123456142';
                features.setup(m => m.deleteMessage(ctx.channelId, ctx.messageId))
                    .resolves({ success: true })
                    .mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup(m => m.query(bbctx, ctx.channelId, undefined))
                    .resolves(ctx.channelId)
                    .mustHappen(1);
                channelIsTextSubtag.setup(m => m.check(bbctx, ctx.channelId))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            title: 'When the command user is not staff and the message isnt owned by the current command',
            code: '{delete;987654322123456142;1234567890123456}',
            expected: '`Author must be staff to delete unrelated messages`',
            errors: [
                { error: new BBTagRuntimeError('Author must be staff to delete unrelated messages') }
            ],
            postSetup(bbctx) {
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined)).resolves(false).mustHappen(1);
            }
        },
        {
            title: 'When the user isnt staff, but the message is owned by the current command',
            code: '{delete;987654322123456142;1234567890123456}',
            expected: '',
            setup(ctx) {
                ctx.ownedMessages.push('1234567890123456');
                features.setup(m => m.deleteMessage('987654322123456142', '1234567890123456'))
                    .resolves({ success: true })
                    .mustHappen(1);
            },
            postSetup(bbctx) {
                channelIdSubtag.setup(m => m.query(bbctx, '987654322123456142', undefined))
                    .resolves('987654322123456142')
                    .mustHappen(1);
                channelIsTextSubtag.setup(m => m.check(bbctx, '987654322123456142'))
                    .resolves(true)
                    .mustHappen(1);
            }
        },
        {
            title: 'When the channel isnt found',
            code: '{delete;987654322123456142;1234567890123456}',
            expected: '`No channel found`',
            errors: [
                { error: new ChannelNotFoundError('987654322123456142') }
            ],
            postSetup(bbctx) {
                channelIdSubtag.setup(m => m.query(bbctx, '987654322123456142', undefined))
                    .resolves(undefined)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
            }
        }
    ]
});
