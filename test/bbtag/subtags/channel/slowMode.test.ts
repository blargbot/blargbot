import { BBTagRuntimeError } from '@blargbot/bbtag';
import type { EditChannelThunk } from '@blargbot/bbtag/subtags';
import { ChannelIdSubtag, SlowModeSubtag } from '@blargbot/bbtag/subtags';
import { snowflake } from '@blargbot/core';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const editChannel = new Mock<EditChannelThunk>({ id: 'editChannel', callable: true });
const channelIdSubtag = new Mock<ChannelIdSubtag>({ id: 'channelId' });

await runSubtagTests({
    subtag: new SlowModeSubtag({
        editChannel: editChannel.instance
    }),
    otherSubtags: [channelIdSubtag.instance],
    argCountBounds: { min: 0, max: 2 },
    names: ['slowMode'],
    setup(ctx) {
        ctx.adoptMock(editChannel);
        ctx.adoptSubtagMock(channelIdSubtag, { type: ChannelIdSubtag });
    },
    cases: [
        {
            code: '{slowmode}',
            expected: '',
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup((m, $) => m.query(bbctx, ctx.channels.command.id, $({ noLookup: true })))
                    .resolves(ctx.channels.command.id)
                    .mustHappen(1);
                editChannel.setup((m, $) => m(ctx.guild.id, ctx.channels.command.id, $({ rateLimitPerUser: 0, auditReason: 'Command User#0000' })))
                    .resolves({ success: true })
                    .mustHappen(1);
            }
        },
        {
            code: '{slowmode;1234}',
            expected: '',
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup((m, $) => m.query(bbctx, '1234', $({ noLookup: true })))
                    .resolves(undefined)
                    .mustHappen(1);
                editChannel.setup((m, $) => m(ctx.guild.id, ctx.channels.command.id, $({ rateLimitPerUser: 1234, auditReason: 'Command User#0000' })))
                    .resolves({ success: true })
                    .mustHappen(1);
            }
        },
        {
            code: '{slowmode;2342543235325252345}',
            expected: '',
            postSetup(bbctx, ctx) {
                const channelId = snowflake.create().toString();
                channelIdSubtag.setup((m, $) => m.query(bbctx, '2342543235325252345', $({ noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                editChannel.setup((m, $) => m(ctx.guild.id, channelId, $({ rateLimitPerUser: 0, auditReason: 'Command User#0000' })))
                    .resolves({ success: true })
                    .mustHappen(1);
            }
        },
        {
            code: '{slowmode;2342543235325252345;37645}',
            expected: '',
            postSetup(bbctx, ctx) {
                const channelId = snowflake.create().toString();
                channelIdSubtag.setup((m, $) => m.query(bbctx, '2342543235325252345', $({ noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                editChannel.setup((m, $) => m(ctx.guild.id, channelId, $({ rateLimitPerUser: 21600, auditReason: 'Command User#0000' })))
                    .resolves({ success: true })
                    .mustHappen(1);
            }
        },
        {
            code: '{slowmode;2342543235325252345;this is some random text}',
            expected: '',
            postSetup(bbctx, ctx) {
                const channelId = snowflake.create().toString();
                channelIdSubtag.setup((m, $) => m.query(bbctx, '2342543235325252345', $({ noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                editChannel.setup((m, $) => m(ctx.guild.id, channelId, $({ rateLimitPerUser: 0, auditReason: 'Command User#0000' })))
                    .resolves({ success: true })
                    .mustHappen(1);
            }
        },
        {
            code: '{slowmode;2342543235325252345}',
            expected: '`Missing required permissions`',
            errors: [
                { error: new BBTagRuntimeError('Missing required permissions', 'Test REST error') }
            ],
            postSetup(bbctx, ctx) {
                const channelId = snowflake.create().toString();
                channelIdSubtag.setup((m, $) => m.query(bbctx, '2342543235325252345', $({ noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                editChannel.setup((m, $) => m(ctx.guild.id, channelId, $({ rateLimitPerUser: 0, auditReason: 'Command User#0000' })))
                    .resolves({ success: false, reason: 'Test REST error' })
                    .mustHappen(1);
            }
        },
        {
            code: '{slowmode;2342543235325252345}',
            expected: '`Missing required permissions`',
            errors: [
                { error: new BBTagRuntimeError('Missing required permissions', 'Some other error message') }
            ],
            postSetup(bbctx, ctx) {
                const channelId = snowflake.create().toString();
                channelIdSubtag.setup((m, $) => m.query(bbctx, '2342543235325252345', $({ noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                editChannel.setup((m, $) => m(ctx.guild.id, channelId, $({ rateLimitPerUser: 0, auditReason: 'Command User#0000' })))
                    .resolves({ success: false, reason: 'Some other error message' })
                    .mustHappen(1);
            }
        }
    ]
});
