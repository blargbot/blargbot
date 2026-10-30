import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '@blargbot/bbtag-engine';
import type { EditMessageFeature, GetMessageAuthorFeature } from '@blargbot/bbtag-engine/subtags';
import { ChannelIdSubtag, EditSubtag, EscapeBBTagSubtag, IsStaffSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { createMockSubtag, runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<EditMessageFeature & GetMessageAuthorFeature>({ id: 'features' });
const isStaffSubtag = createMockSubtag(IsStaffSubtag);
const channelIdSubtag = createMockSubtag(ChannelIdSubtag);

await runSubtagTests({
    subtag: new EditSubtag(features.instance),
    otherSubtags: [channelIdSubtag.instance, isStaffSubtag.instance],
    argCountBounds: { min: 2, max: 4 },
    names: ['edit'],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(isStaffSubtag);
        ctx.adoptMock(channelIdSubtag);
    },
    cases: [
        {
            title: 'When the message cannot be found',
            code: '{edit;12345678901234567;New message text}',
            expected: '`No message found`',
            errors: [
                { error: new MessageNotFoundError('987654321123456789', '12345678901234567') }
            ],
            setup(ctx) {
                ctx.channelId = ctx.channelId = '987654321123456789';
                features.setup(m => m.getMessageAuthor(ctx.channelId, '12345678901234567'))
                    .resolves(undefined)
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, ctx.channelId, $({ noLookup: true })))
                    .resolves(ctx.channelId)
                    .mustHappen(1);
            }
        },
        {
            title: 'When the message wasnt sent by the bot',
            code: '{edit;12345678901234567;New message text}',
            expected: '`I must be the message author`',
            errors: [
                { error: new BBTagRuntimeError('I must be the message author') }
            ],
            setup(ctx) {
                ctx.channelId = ctx.channelId = '987654321123456789';
                features.setup(m => m.getMessageAuthor(ctx.channelId, '12345678901234567'))
                    .resolves('812768723681368213')
                    .mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, ctx.channelId, $({ noLookup: true })))
                    .resolves(ctx.channelId)
                    .mustHappen(1);
            }
        },
        {
            title: 'When the message is empty',
            code: '{edit;12345678901234567;_delete}',
            expected: '`Message cannot be empty`',
            errors: [
                { error: new BBTagRuntimeError('Message cannot be empty') }
            ],
            setup(ctx) {
                ctx.channelId = ctx.channelId = '987654321123456789';
                features.setup(m => m.getMessageAuthor(ctx.channelId, '12345678901234567'))
                    .resolves(ctx.botId)
                    .mustHappen(1);
                features.setup((m, $) => m.editMessage($({
                    channelId: ctx.channelId,
                    messageId: '12345678901234567',
                    content: '',
                    embeds: undefined
                }))).resolves({ success: false, cause: 'messageEmpty' }).mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, ctx.channelId, $({ noLookup: true })))
                    .resolves(ctx.channelId)
                    .mustHappen(1);
            }
        },
        {
            code: '{edit;12345678901234567;New message text}',
            expected: '',
            setup(ctx) {
                ctx.channelId = ctx.channelId = '987654321123456789';
                features.setup(m => m.getMessageAuthor(ctx.channelId, '12345678901234567'))
                    .resolves(ctx.botId)
                    .mustHappen(1);
                features.setup((m, $) => m.editMessage($({
                    channelId: ctx.channelId,
                    messageId: '12345678901234567',
                    content: 'New message text',
                    embeds: undefined
                }))).resolves({ success: true }).mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, ctx.channelId, $({ noLookup: true })))
                    .resolves(ctx.channelId)
                    .mustHappen(1);
            }
        },
        {
            code: '{edit;12345678901234567;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.channelId = ctx.channelId = '987654321123456789';
                features.setup(m => m.getMessageAuthor(ctx.channelId, '12345678901234567'))
                    .resolves(ctx.botId)
                    .mustHappen(1);
                features.setup((m, $) => m.editMessage($({
                    channelId: ctx.channelId,
                    messageId: '12345678901234567',
                    content: undefined,
                    embeds: [{ title: 'New embed!' }]
                }))).resolves({ success: true }).mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, ctx.channelId, $({ noLookup: true })))
                    .resolves(ctx.channelId)
                    .mustHappen(1);
            }
        },
        {
            code: '{edit;12345678901234567;{escapebbtag;{"title":false}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.channelId = ctx.channelId = '987654321123456789';
                features.setup(m => m.getMessageAuthor(ctx.channelId, '12345678901234567'))
                    .resolves(ctx.botId)
                    .mustHappen(1);
                features.setup((m, $) => m.editMessage($({
                    channelId: ctx.channelId,
                    messageId: '12345678901234567',
                    content: '{"title":false}',
                    embeds: undefined
                }))).resolves({ success: true }).mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, ctx.channelId, $({ noLookup: true })))
                    .resolves(ctx.channelId)
                    .mustHappen(1);
            }
        },
        {
            code: '{edit;12345678901234567;_delete}',
            expected: '',
            setup(ctx) {
                ctx.channelId = ctx.channelId = '987654321123456789';
                features.setup(m => m.getMessageAuthor(ctx.channelId, '12345678901234567'))
                    .resolves(ctx.botId)
                    .mustHappen(1);
                features.setup((m, $) => m.editMessage($({
                    channelId: ctx.channelId,
                    messageId: '12345678901234567',
                    content: '',
                    embeds: undefined
                }))).resolves({ success: true }).mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, ctx.channelId, $({ noLookup: true })))
                    .resolves(ctx.channelId)
                    .mustHappen(1);
            }
        },
        {
            code: '{edit;12345678901234567;New message text;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.channelId = ctx.channelId = '987654321123456789';
                features.setup(m => m.getMessageAuthor(ctx.channelId, '12345678901234567'))
                    .resolves(ctx.botId)
                    .mustHappen(1);
                features.setup((m, $) => m.editMessage($({
                    channelId: ctx.channelId,
                    messageId: '12345678901234567',
                    content: 'New message text',
                    embeds: [{ title: 'New embed!' }]
                }))).resolves({ success: true }).mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '12345678901234567', $({ noLookup: true })))
                    .resolves(undefined)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, ctx.channelId, $({ noLookup: true })))
                    .resolves(ctx.channelId)
                    .mustHappen(1);
            }
        },
        {
            code: '{edit;12345678901234567;{escapebbtag;{"title":"New embed!"}};New message text}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.channelId = ctx.channelId = '987654321123456789';
                features.setup(m => m.getMessageAuthor(ctx.channelId, '12345678901234567'))
                    .resolves(ctx.botId)
                    .mustHappen(1);
                features.setup((m, $) => m.editMessage($({
                    channelId: ctx.channelId,
                    messageId: '12345678901234567',
                    content: '{"title":"New embed!"}',
                    embeds: [{ fields: [{ name: 'Malformed JSON', value: '"New message text"' }], malformed: true }]
                }))).resolves({ success: true }).mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '12345678901234567', $({ noLookup: true })))
                    .resolves(undefined)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, ctx.channelId, $({ noLookup: true })))
                    .resolves(ctx.channelId)
                    .mustHappen(1);
            }
        },
        {
            title: 'When the message is empty',
            code: '{edit;12345678901234567;_delete;_delete}',
            expected: '`Message cannot be empty`',
            errors: [
                { error: new BBTagRuntimeError('Message cannot be empty') }
            ],
            setup(ctx) {
                ctx.channelId = ctx.channelId = '987654321123456789';
                features.setup(m => m.getMessageAuthor(ctx.channelId, '12345678901234567'))
                    .resolves(ctx.botId)
                    .mustHappen(1);
                features.setup((m, $) => m.editMessage($({
                    channelId: ctx.channelId,
                    messageId: '12345678901234567',
                    content: '',
                    embeds: []
                }))).resolves({ success: false, cause: 'messageEmpty' }).mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '12345678901234567', $({ noLookup: true })))
                    .resolves(undefined)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, ctx.channelId, $({ noLookup: true })))
                    .resolves(ctx.channelId)
                    .mustHappen(1);
            }
        },
        {
            code: '{edit;9876543212345678;12345678901234567;New message text}',
            expected: '',
            setup(ctx) {
                features.setup(m => m.getMessageAuthor('9876543212345678', '12345678901234567'))
                    .resolves(ctx.botId)
                    .mustHappen(1);
                features.setup((m, $) => m.editMessage($({
                    channelId: '9876543212345678',
                    messageId: '12345678901234567',
                    content: 'New message text',
                    embeds: undefined
                }))).resolves({ success: true }).mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '9876543212345678', $({ noLookup: true })))
                    .resolves('9876543212345678')
                    .mustHappen(1);
            }
        },
        {
            code: '{edit;9876543212345678;12345678901234567;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                features.setup(m => m.getMessageAuthor('9876543212345678', '12345678901234567'))
                    .resolves(ctx.botId)
                    .mustHappen(1);
                features.setup((m, $) => m.editMessage($({
                    channelId: '9876543212345678',
                    messageId: '12345678901234567',
                    content: undefined,
                    embeds: [{ title: 'New embed!' }]
                }))).resolves({ success: true }).mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '9876543212345678', $({ noLookup: true })))
                    .resolves('9876543212345678')
                    .mustHappen(1);
            }
        },
        {
            code: '{edit;9876543212345678;12345678901234567;{escapebbtag;{"title":false}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                features.setup(m => m.getMessageAuthor('9876543212345678', '12345678901234567'))
                    .resolves(ctx.botId)
                    .mustHappen(1);
                features.setup((m, $) => m.editMessage($({
                    channelId: '9876543212345678',
                    messageId: '12345678901234567',
                    content: '{"title":false}',
                    embeds: undefined
                }))).resolves({ success: true }).mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '9876543212345678', $({ noLookup: true })))
                    .resolves('9876543212345678')
                    .mustHappen(1);
            }
        },
        {
            code: '{edit;9876543212345678;12345678901234567;_delete}',
            expected: '',
            setup(ctx) {
                features.setup(m => m.getMessageAuthor('9876543212345678', '12345678901234567'))
                    .resolves(ctx.botId)
                    .mustHappen(1);
                features.setup((m, $) => m.editMessage($({
                    channelId: '9876543212345678',
                    messageId: '12345678901234567',
                    content: '',
                    embeds: undefined
                }))).resolves({ success: true }).mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '9876543212345678', $({ noLookup: true })))
                    .resolves('9876543212345678')
                    .mustHappen(1);
            }
        },
        {
            code: '{edit;9876543212345678;12345678901234567;New message text;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                features.setup(m => m.getMessageAuthor('9876543212345678', '12345678901234567'))
                    .resolves(ctx.botId)
                    .mustHappen(1);
                features.setup((m, $) => m.editMessage($({
                    channelId: '9876543212345678',
                    messageId: '12345678901234567',
                    content: 'New message text',
                    embeds: [{ title: 'New embed!' }]
                }))).resolves({ success: true }).mustHappen(1);
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '9876543212345678', $({ noLookup: true })))
                    .resolves('9876543212345678')
                    .mustHappen(1);
            }
        },
        {
            title: 'When no channel is found',
            code: '{edit;9876543212345678;12345678901234567;New message text;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '`No channel found`',
            errors: [
                { error: new ChannelNotFoundError('9876543212345678') }
            ],
            setup(ctx) {
                isStaffSubtag.setup(m => m.isStaff(ctx.bbtag, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '9876543212345678', $({ noLookup: true })))
                    .resolves(undefined)
                    .mustHappen(1);
            }
        }
    ]
});
