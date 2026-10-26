import { BBTagRuntimeError, ChannelNotFoundError, MessageNotFoundError } from '@blargbot/bbtag';
import type { EditMessageFeature, GetMessageAuthorFeature } from '@blargbot/bbtag/subtags';
import { ChannelIdSubtag, EditSubtag, EscapeBBTagSubtag, IsStaffSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<EditMessageFeature & GetMessageAuthorFeature>({ id: 'features' });
const isStaffSubtag = new Mock<IsStaffSubtag>({ id: 'IsStaffSubtag' });
const channelIdSubtag = new Mock<ChannelIdSubtag>({ id: 'ChannelIdSubtag' });

await runSubtagTests({
    subtag: new EditSubtag(features.instance),
    otherSubtags: [channelIdSubtag.instance, isStaffSubtag.instance],
    argCountBounds: { min: 2, max: 4 },
    names: ['edit'],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptSubtagMock(isStaffSubtag, { type: IsStaffSubtag });
        ctx.adoptSubtagMock(channelIdSubtag, { type: ChannelIdSubtag });
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
                ctx.message.channel_id = ctx.channels.command.id = '987654321123456789';
                features.setup(m => m.getMessageAuthor(ctx.channels.command.id, '12345678901234567'))
                    .resolves(undefined)
                    .mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(bbctx, ctx.channels.command.id, $({ noLookup: true })))
                    .resolves(ctx.channels.command.id)
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
                ctx.message.channel_id = ctx.channels.command.id = '987654321123456789';
                features.setup(m => m.getMessageAuthor(ctx.channels.command.id, '12345678901234567'))
                    .resolves('812768723681368213')
                    .mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(bbctx, ctx.channels.command.id, $({ noLookup: true })))
                    .resolves(ctx.channels.command.id)
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
                ctx.message.channel_id = ctx.channels.command.id = '987654321123456789';
                features.setup(m => m.getMessageAuthor(ctx.channels.command.id, '12345678901234567'))
                    .resolves(ctx.users.bot.id)
                    .mustHappen(1);
                features.setup((m, $) => m.editMessage($({
                    channelId: ctx.channels.command.id,
                    messageId: '12345678901234567',
                    content: '',
                    embeds: undefined
                }))).resolves({ success: false, cause: 'messageEmpty' }).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(bbctx, ctx.channels.command.id, $({ noLookup: true })))
                    .resolves(ctx.channels.command.id)
                    .mustHappen(1);
            }
        },
        {
            code: '{edit;12345678901234567;New message text}',
            expected: '',
            setup(ctx) {
                ctx.message.channel_id = ctx.channels.command.id = '987654321123456789';
                features.setup(m => m.getMessageAuthor(ctx.channels.command.id, '12345678901234567'))
                    .resolves(ctx.users.bot.id)
                    .mustHappen(1);
                features.setup((m, $) => m.editMessage($({
                    channelId: ctx.channels.command.id,
                    messageId: '12345678901234567',
                    content: 'New message text',
                    embeds: undefined
                }))).resolves({ success: true }).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(bbctx, ctx.channels.command.id, $({ noLookup: true })))
                    .resolves(ctx.channels.command.id)
                    .mustHappen(1);
            }
        },
        {
            code: '{edit;12345678901234567;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.message.channel_id = ctx.channels.command.id = '987654321123456789';
                features.setup(m => m.getMessageAuthor(ctx.channels.command.id, '12345678901234567'))
                    .resolves(ctx.users.bot.id)
                    .mustHappen(1);
                features.setup((m, $) => m.editMessage($({
                    channelId: ctx.channels.command.id,
                    messageId: '12345678901234567',
                    content: undefined,
                    embeds: [{ title: 'New embed!' }]
                }))).resolves({ success: true }).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(bbctx, ctx.channels.command.id, $({ noLookup: true })))
                    .resolves(ctx.channels.command.id)
                    .mustHappen(1);
            }
        },
        {
            code: '{edit;12345678901234567;{escapebbtag;{"title":false}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.message.channel_id = ctx.channels.command.id = '987654321123456789';
                features.setup(m => m.getMessageAuthor(ctx.channels.command.id, '12345678901234567'))
                    .resolves(ctx.users.bot.id)
                    .mustHappen(1);
                features.setup((m, $) => m.editMessage($({
                    channelId: ctx.channels.command.id,
                    messageId: '12345678901234567',
                    content: '{"title":false}',
                    embeds: undefined
                }))).resolves({ success: true }).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(bbctx, ctx.channels.command.id, $({ noLookup: true })))
                    .resolves(ctx.channels.command.id)
                    .mustHappen(1);
            }
        },
        {
            code: '{edit;12345678901234567;_delete}',
            expected: '',
            setup(ctx) {
                ctx.message.channel_id = ctx.channels.command.id = '987654321123456789';
                features.setup(m => m.getMessageAuthor(ctx.channels.command.id, '12345678901234567'))
                    .resolves(ctx.users.bot.id)
                    .mustHappen(1);
                features.setup((m, $) => m.editMessage($({
                    channelId: ctx.channels.command.id,
                    messageId: '12345678901234567',
                    content: '',
                    embeds: undefined
                }))).resolves({ success: true }).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(bbctx, ctx.channels.command.id, $({ noLookup: true })))
                    .resolves(ctx.channels.command.id)
                    .mustHappen(1);
            }
        },
        {
            code: '{edit;12345678901234567;New message text;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.message.channel_id = ctx.channels.command.id = '987654321123456789';
                features.setup(m => m.getMessageAuthor(ctx.channels.command.id, '12345678901234567'))
                    .resolves(ctx.users.bot.id)
                    .mustHappen(1);
                features.setup((m, $) => m.editMessage($({
                    channelId: ctx.channels.command.id,
                    messageId: '12345678901234567',
                    content: 'New message text',
                    embeds: [{ title: 'New embed!' }]
                }))).resolves({ success: true }).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(bbctx, '12345678901234567', $({ noLookup: true })))
                    .resolves(undefined)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(bbctx, ctx.channels.command.id, $({ noLookup: true })))
                    .resolves(ctx.channels.command.id)
                    .mustHappen(1);
            }
        },
        {
            code: '{edit;12345678901234567;{escapebbtag;{"title":"New embed!"}};New message text}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.message.channel_id = ctx.channels.command.id = '987654321123456789';
                features.setup(m => m.getMessageAuthor(ctx.channels.command.id, '12345678901234567'))
                    .resolves(ctx.users.bot.id)
                    .mustHappen(1);
                features.setup((m, $) => m.editMessage($({
                    channelId: ctx.channels.command.id,
                    messageId: '12345678901234567',
                    content: '{"title":"New embed!"}',
                    embeds: [{ fields: [{ name: 'Malformed JSON', value: '"New message text"' }], malformed: true }]
                }))).resolves({ success: true }).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(bbctx, '12345678901234567', $({ noLookup: true })))
                    .resolves(undefined)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(bbctx, ctx.channels.command.id, $({ noLookup: true })))
                    .resolves(ctx.channels.command.id)
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
                ctx.message.channel_id = ctx.channels.command.id = '987654321123456789';
                features.setup(m => m.getMessageAuthor(ctx.channels.command.id, '12345678901234567'))
                    .resolves(ctx.users.bot.id)
                    .mustHappen(1);
                features.setup((m, $) => m.editMessage($({
                    channelId: ctx.channels.command.id,
                    messageId: '12345678901234567',
                    content: '',
                    embeds: []
                }))).resolves({ success: false, cause: 'messageEmpty' }).mustHappen(1);
            },
            postSetup(bbctx, ctx) {
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(bbctx, '12345678901234567', $({ noLookup: true })))
                    .resolves(undefined)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(bbctx, ctx.channels.command.id, $({ noLookup: true })))
                    .resolves(ctx.channels.command.id)
                    .mustHappen(1);
            }
        },
        {
            code: '{edit;9876543212345678;12345678901234567;New message text}',
            expected: '',
            setup(ctx) {
                ctx.channels.general.id = '9876543212345678';
                features.setup(m => m.getMessageAuthor('9876543212345678', '12345678901234567'))
                    .resolves(ctx.users.bot.id)
                    .mustHappen(1);
                features.setup((m, $) => m.editMessage($({
                    channelId: '9876543212345678',
                    messageId: '12345678901234567',
                    content: 'New message text',
                    embeds: undefined
                }))).resolves({ success: true }).mustHappen(1);
            },
            postSetup(bbctx) {
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(bbctx, '9876543212345678', $({ noLookup: true })))
                    .resolves('9876543212345678')
                    .mustHappen(1);
            }
        },
        {
            code: '{edit;9876543212345678;12345678901234567;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.channels.general.id = '9876543212345678';
                features.setup(m => m.getMessageAuthor('9876543212345678', '12345678901234567'))
                    .resolves(ctx.users.bot.id)
                    .mustHappen(1);
                features.setup((m, $) => m.editMessage($({
                    channelId: '9876543212345678',
                    messageId: '12345678901234567',
                    content: undefined,
                    embeds: [{ title: 'New embed!' }]
                }))).resolves({ success: true }).mustHappen(1);
            },
            postSetup(bbctx) {
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(bbctx, '9876543212345678', $({ noLookup: true })))
                    .resolves('9876543212345678')
                    .mustHappen(1);
            }
        },
        {
            code: '{edit;9876543212345678;12345678901234567;{escapebbtag;{"title":false}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.channels.general.id = '9876543212345678';
                features.setup(m => m.getMessageAuthor('9876543212345678', '12345678901234567'))
                    .resolves(ctx.users.bot.id)
                    .mustHappen(1);
                features.setup((m, $) => m.editMessage($({
                    channelId: '9876543212345678',
                    messageId: '12345678901234567',
                    content: '{"title":false}',
                    embeds: undefined
                }))).resolves({ success: true }).mustHappen(1);
            },
            postSetup(bbctx) {
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(bbctx, '9876543212345678', $({ noLookup: true })))
                    .resolves('9876543212345678')
                    .mustHappen(1);
            }
        },
        {
            code: '{edit;9876543212345678;12345678901234567;_delete}',
            expected: '',
            setup(ctx) {
                ctx.channels.general.id = '9876543212345678';
                features.setup(m => m.getMessageAuthor('9876543212345678', '12345678901234567'))
                    .resolves(ctx.users.bot.id)
                    .mustHappen(1);
                features.setup((m, $) => m.editMessage($({
                    channelId: '9876543212345678',
                    messageId: '12345678901234567',
                    content: '',
                    embeds: undefined
                }))).resolves({ success: true }).mustHappen(1);
            },
            postSetup(bbctx) {
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(bbctx, '9876543212345678', $({ noLookup: true })))
                    .resolves('9876543212345678')
                    .mustHappen(1);
            }
        },
        {
            code: '{edit;9876543212345678;12345678901234567;New message text;{escapebbtag;{"title":"New embed!"}}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                ctx.channels.general.id = '9876543212345678';
                features.setup(m => m.getMessageAuthor('9876543212345678', '12345678901234567'))
                    .resolves(ctx.users.bot.id)
                    .mustHappen(1);
                features.setup((m, $) => m.editMessage($({
                    channelId: '9876543212345678',
                    messageId: '12345678901234567',
                    content: 'New message text',
                    embeds: [{ title: 'New embed!' }]
                }))).resolves({ success: true }).mustHappen(1);
            },
            postSetup(bbctx) {
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(bbctx, '9876543212345678', $({ noLookup: true })))
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
                ctx.channels.general.id = '9876543212345678';
            },
            postSetup(bbctx) {
                isStaffSubtag.setup(m => m.isStaff(bbctx, undefined))
                    .resolves(true)
                    .mustHappen(1);
                channelIdSubtag.setup((m, $) => m.query(bbctx, '9876543212345678', $({ noLookup: true })))
                    .resolves(undefined)
                    .mustHappen(1);
            }
        }
    ]
});
