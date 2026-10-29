import { BBTagRuntimeError } from '@blargbot/bbtag';
import type { EditChannelFeature } from '@blargbot/bbtag/subtags';
import { ChannelIdSubtag, ReasonSubtag, SlowModeSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { createSnowflake } from '../../snowflake.js';
import { createMockSubtag, runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<EditChannelFeature>({ id: 'features' });
const channelIdSubtag = createMockSubtag(ChannelIdSubtag);
const reasonSubtag = createMockSubtag(ReasonSubtag);

await runSubtagTests({
    subtag: new SlowModeSubtag(features.instance),
    otherSubtags: [channelIdSubtag.instance, reasonSubtag.instance],
    argCountBounds: { min: 0, max: 2 },
    names: ['slowMode'],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(channelIdSubtag);
        ctx.adoptMock(reasonSubtag);
        reasonSubtag.setup(m => m.get(ctx.bbtag)).resolves('@command.user');
    },
    cases: [
        {
            code: '{slowmode}',
            expected: '',
            setup(ctx) {
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, ctx.channelId, $({ noLookup: true })))
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
            setup(ctx) {
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '1234', $({ noLookup: true })))
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
            setup(ctx) {
                const channelId = createSnowflake();
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '2342543235325252345', $({ noLookup: true })))
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
            setup(ctx) {
                const channelId = createSnowflake();
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '2342543235325252345', $({ noLookup: true })))
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
            setup(ctx) {
                const channelId = createSnowflake();
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '2342543235325252345', $({ noLookup: true })))
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
            setup(ctx) {
                const channelId = createSnowflake();
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '2342543235325252345', $({ noLookup: true })))
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
            setup(ctx) {
                const channelId = createSnowflake();
                channelIdSubtag.setup((m, $) => m.query(ctx.bbtag, '2342543235325252345', $({ noLookup: true })))
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
