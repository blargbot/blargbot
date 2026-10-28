import { BBTagRuntimeError } from '@blargbot/bbtag';
import type { EditChannelFeature } from '@blargbot/bbtag/subtags';
import { ChannelIdSubtag, ReasonSubtag, SlowModeSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { createSnowflake } from '../../snowflake.js';
import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<EditChannelFeature>({ id: 'features' });
const channelIdSubtag = new Mock<ChannelIdSubtag>({ id: 'channelId' });
const reasonSubtag = new Mock<ReasonSubtag>({ id: 'ReasonSubtag' });

await runSubtagTests({
    subtag: new SlowModeSubtag(features.instance),
    otherSubtags: [channelIdSubtag.instance, reasonSubtag.instance],
    argCountBounds: { min: 0, max: 2 },
    names: ['slowMode'],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptSubtagMock(channelIdSubtag, { type: ChannelIdSubtag });
        ctx.adoptSubtagMock(reasonSubtag, { type: ReasonSubtag });
    },
    postSetup(bbctx) {
        reasonSubtag.setup(m => m.get(bbctx)).resolves('@command.user');
    },
    cases: [
        {
            code: '{slowmode}',
            expected: '',
            postSetup(bbctx, ctx) {
                channelIdSubtag.setup((m, $) => m.query(bbctx, ctx.channelId, $({ noLookup: true })))
                    .resolves(ctx.channelId)
                    .mustHappen(1);
                features.setup((m, $) => m.editChannel($({
                    guildId: ctx.guildId,
                    channelId: ctx.channelId,
                    rateLimitPerUser: 0,
                    auditReason: '@command.user'
                })))
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
                features.setup((m, $) => m.editChannel($({
                    guildId: ctx.guildId,
                    channelId: ctx.channelId,
                    rateLimitPerUser: 1234,
                    auditReason: '@command.user'
                })))
                    .resolves({ success: true })
                    .mustHappen(1);
            }
        },
        {
            code: '{slowmode;2342543235325252345}',
            expected: '',
            postSetup(bbctx, ctx) {
                const channelId = createSnowflake();
                channelIdSubtag.setup((m, $) => m.query(bbctx, '2342543235325252345', $({ noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                features.setup((m, $) => m.editChannel($({
                    guildId: ctx.guildId,
                    channelId,
                    rateLimitPerUser: 0,
                    auditReason: '@command.user'
                })))
                    .resolves({ success: true })
                    .mustHappen(1);
            }
        },
        {
            code: '{slowmode;2342543235325252345;37645}',
            expected: '',
            postSetup(bbctx, ctx) {
                const channelId = createSnowflake();
                channelIdSubtag.setup((m, $) => m.query(bbctx, '2342543235325252345', $({ noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                features.setup((m, $) => m.editChannel($({
                    guildId: ctx.guildId,
                    channelId,
                    rateLimitPerUser: 21600,
                    auditReason: '@command.user'
                })))
                    .resolves({ success: true })
                    .mustHappen(1);
            }
        },
        {
            code: '{slowmode;2342543235325252345;this is some random text}',
            expected: '',
            postSetup(bbctx, ctx) {
                const channelId = createSnowflake();
                channelIdSubtag.setup((m, $) => m.query(bbctx, '2342543235325252345', $({ noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                features.setup((m, $) => m.editChannel($({
                    guildId: ctx.guildId,
                    channelId,
                    rateLimitPerUser: 0,
                    auditReason: '@command.user'
                })))
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
                const channelId = createSnowflake();
                channelIdSubtag.setup((m, $) => m.query(bbctx, '2342543235325252345', $({ noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                features.setup((m, $) => m.editChannel($({
                    guildId: ctx.guildId,
                    channelId,
                    rateLimitPerUser: 0,
                    auditReason: '@command.user'
                })))
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
                const channelId = createSnowflake();
                channelIdSubtag.setup((m, $) => m.query(bbctx, '2342543235325252345', $({ noLookup: true })))
                    .resolves(channelId)
                    .mustHappen(1);
                features.setup((m, $) => m.editChannel($({
                    guildId: ctx.guildId,
                    channelId,
                    rateLimitPerUser: 0,
                    auditReason: '@command.user'
                })))
                    .resolves({ success: false, reason: 'Some other error message' })
                    .mustHappen(1);
            }
        }
    ]
});
