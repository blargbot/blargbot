import { UserNotFoundError } from '@blargbot/bbtag-engine';
import type { GetDmChannelIdFeature, GetGuildNameFeature, GetUserNameFeature, SendFeature } from '@blargbot/bbtag-engine/subtags';
import { DMSubtag, EscapeBBTagSubtag, UserIdSubtag } from '@blargbot/bbtag-engine/subtags';
import { Mock } from '@blargbot/test-util';

import { createSnowflake } from '../../snowflake.js';
import { createMockSubtag, MarkerError, runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<SendFeature & GetDmChannelIdFeature & GetGuildNameFeature & GetUserNameFeature>({ id: 'features' });
const userIdSubtag = createMockSubtag(UserIdSubtag);

await runSubtagTests({
    subtag: new DMSubtag(features.instance),
    argCountBounds: { min: 2, max: 3 },
    names: ['dm'],
    otherSubtags: [userIdSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptMock(userIdSubtag);
    },
    cases: [
        {
            code: '{dm;aaaa;{eval}}',
            expected: '`No user found`',
            errors: [
                { start: 9, end: 15, error: new MarkerError('eval', 9) },
                { error: new UserNotFoundError('aaaa') }
            ],
            setup(ctx) {
                userIdSubtag.setup(m => m.query(ctx.bbtag, 'aaaa', undefined))
                    .resolves(undefined)
                    .mustHappen(1);
            }
        },
        {
            code: '{dm;other user;Hello!}',
            expected: '',
            setup(ctx) {
                const userId = createSnowflake();
                const channelId = createSnowflake();
                userIdSubtag.setup(m => m.query(ctx.bbtag, 'other user', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getDmChannelId(userId))
                    .resolves(channelId)
                    .mustHappen(1);
                features.setup(m => m.getGuildName(ctx.guildId)).resolves('Test Guild').mustHappen(1);
                features.setup(m => m.getUserName(ctx.userId)).resolves('command.user').mustHappen(1);
                features.setup((m, $) => m.sendMessage(channelId, $({ content: `The following message was sent from **__Test Guild__** (${ctx.guildId}), and was sent by **__@command.user__** (${ctx.userId}):` })))
                    .mustHappen(1)
                    .resolves({ success: true, id: 'unused' });
                features.setup((m, $) => m.sendMessage(channelId, $({ content: 'Hello!', embeds: undefined })))
                    .mustHappen(1)
                    .resolves({ success: true, id: 'unused' });
            }
        },
        {
            code: '{dm;other user;{escapebbtag;{ "title": "Hi!" }}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                const userId = createSnowflake();
                const channelId = createSnowflake();
                userIdSubtag.setup(m => m.query(ctx.bbtag, 'other user', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getDmChannelId(userId))
                    .resolves(channelId)
                    .mustHappen(1);
                features.setup(m => m.getGuildName(ctx.guildId)).resolves('Test Guild').mustHappen(1);
                features.setup(m => m.getUserName(ctx.userId)).resolves('command.user').mustHappen(1);
                features.setup((m, $) => m.sendMessage(channelId, $({ content: `The following message was sent from **__Test Guild__** (${ctx.guildId}), and was sent by **__@command.user__** (${ctx.userId}):` })))
                    .mustHappen(1)
                    .resolves({ success: true, id: 'unused' });
                features.setup((m, $) => m.sendMessage(channelId, $({ content: undefined, embeds: [{ title: 'Hi!' }] })))
                    .mustHappen(1)
                    .resolves({ success: true, id: 'unused' });
            }
        },
        {
            code: '{dm;other user;Hello there!;{escapebbtag;{ "title": "General Kenobi!" }}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                const userId = createSnowflake();
                const channelId = createSnowflake();
                userIdSubtag.setup(m => m.query(ctx.bbtag, 'other user', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getDmChannelId(userId))
                    .resolves(channelId)
                    .mustHappen(1);
                features.setup(m => m.getGuildName(ctx.guildId)).resolves('Test Guild').mustHappen(1);
                features.setup(m => m.getUserName(ctx.userId)).resolves('command.user').mustHappen(1);
                features.setup((m, $) => m.sendMessage(channelId, $({ content: `The following message was sent from **__Test Guild__** (${ctx.guildId}), and was sent by **__@command.user__** (${ctx.userId}):` })))
                    .mustHappen(1)
                    .resolves({ success: true, id: 'unused' });
                features.setup((m, $) => m.sendMessage(channelId, $({ content: 'Hello there!', embeds: [{ title: 'General Kenobi!' }] })))
                    .mustHappen(1)
                    .resolves({ success: true, id: 'unused' });
            }
        },
        {
            code: '{dm;other user;{escapebbtag;{ "title": "this isnt actually an embed" }};{escapebbtag;{ "title": "General Kenobi!" }}}',
            subtags: [new EscapeBBTagSubtag()],
            expected: '',
            setup(ctx) {
                const userId = createSnowflake();
                const channelId = createSnowflake();
                userIdSubtag.setup(m => m.query(ctx.bbtag, 'other user', undefined))
                    .resolves(userId)
                    .mustHappen(1);
                features.setup(m => m.getDmChannelId(userId))
                    .resolves(channelId)
                    .mustHappen(1);
                features.setup(m => m.getGuildName(ctx.guildId)).resolves('Test Guild').mustHappen(1);
                features.setup(m => m.getUserName(ctx.userId)).resolves('command.user').mustHappen(1);
                features.setup((m, $) => m.sendMessage(channelId, $({ content: `The following message was sent from **__Test Guild__** (${ctx.guildId}), and was sent by **__@command.user__** (${ctx.userId}):` })))
                    .mustHappen(1)
                    .resolves({ success: true, id: 'unused' });
                features.setup((m, $) => m.sendMessage(channelId, $({ content: '{ "title": "this isnt actually an embed" }', embeds: [{ title: 'General Kenobi!' }] })))
                    .mustHappen(1)
                    .resolves({ success: true, id: 'unused' });
            }
        },
        {
            code: '{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}',
            expected: '',
            setup(ctx) {
                const userId = createSnowflake();
                const channelId = createSnowflake();
                userIdSubtag.setup(m => m.query(ctx.bbtag, 'other user', undefined))
                    .resolves(userId)
                    .mustHappen(5);
                features.setup(m => m.getDmChannelId(userId))
                    .resolves(channelId)
                    .mustHappen(5);
                features.setup(m => m.getGuildName(ctx.guildId)).resolves('Test Guild').mustHappen(1);
                features.setup(m => m.getUserName(ctx.userId)).resolves('command.user').mustHappen(1);
                features.setup((m, $) => m.sendMessage(channelId, $({ content: `The following message was sent from **__Test Guild__** (${ctx.guildId}), and was sent by **__@command.user__** (${ctx.userId}):` })))
                    .mustHappen(1)
                    .resolves({ success: true, id: 'unused' });
                features.setup((m, $) => m.sendMessage(channelId, $({ content: 'Hi!', embeds: undefined })))
                    .mustHappen(5)
                    .resolves({ success: true, id: 'unused' });
            }
        },
        {
            code: '{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}{dm;other user;Hi!}',
            expected: '',
            setup(ctx) {
                const userId = createSnowflake();
                const channelId = createSnowflake();
                userIdSubtag.setup(m => m.query(ctx.bbtag, 'other user', undefined))
                    .resolves(userId)
                    .mustHappen(6);
                features.setup(m => m.getDmChannelId(userId))
                    .resolves(channelId)
                    .mustHappen(6);
                features.setup(m => m.getGuildName(ctx.guildId)).resolves('Test Guild').mustHappen(2);
                features.setup(m => m.getUserName(ctx.userId)).resolves('command.user').mustHappen(2);
                features.setup((m, $) => m.sendMessage(channelId, $({ content: `The following message was sent from **__Test Guild__** (${ctx.guildId}), and was sent by **__@command.user__** (${ctx.userId}):` })))
                    .mustHappen(2)
                    .resolves({ success: true, id: 'unused' });
                features.setup((m, $) => m.sendMessage(channelId, $({ content: 'Hi!', embeds: undefined })))
                    .mustHappen(6)
                    .resolves({ success: true, id: 'unused' });
            }
        }
    ]
});
