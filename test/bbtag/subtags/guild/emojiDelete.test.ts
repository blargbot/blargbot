import { BBTagRuntimeError, DiscordPermissions } from '@blargbot/bbtag';
import type { DeleteEmojiFeature, GetMemberPermissionsFeature } from '@blargbot/bbtag/subtags';
import { EmojiDeleteSubtag, ReasonSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';

const features = new Mock<DeleteEmojiFeature & GetMemberPermissionsFeature>({ id: 'features' });
const reasonSubtag = new Mock<ReasonSubtag>({ id: 'ReasonSubtag' });

await runSubtagTests({
    subtag: new EmojiDeleteSubtag(features.instance),
    argCountBounds: { min: 1, max: 1 },
    names: ['emojiDelete'],
    otherSubtags: [reasonSubtag.instance],
    setup(ctx) {
        ctx.adoptMock(features);
        ctx.adoptSubtagMock(reasonSubtag, { type: ReasonSubtag });
    },
    postSetup(bbctx) {
        reasonSubtag.setup(m => m.get(bbctx)).resolves('@command.user');
    },
    cases: [
        {
            code: '{emojidelete;234762389364243}',
            expected: '',
            setup(ctx) {
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId))
                    .resolves(DiscordPermissions.MANAGE_GUILD_EXPRESSIONS)
                    .mustHappen(1);
                features.setup((m, $) => m.deleteEmoji($({
                    guildId: ctx.guildId,
                    emojiId: '234762389364243',
                    auditReason: '@command.user'
                }))).resolves({ success: true }).mustHappen(1);
            }
        },
        {
            code: '{emojidelete;234762389364243}',
            expected: '`Author cannot delete emojis`',
            errors: [
                { error: new BBTagRuntimeError('Author cannot delete emojis') }
            ],
            setup(ctx) {
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId))
                    .resolves(DiscordPermissions.NONE)
                    .mustHappen(1);
            }
        },
        {
            code: '{emojidelete;234762389364243}',
            expected: '`Failed to delete emoji: This is an error`',
            errors: [
                { error: new BBTagRuntimeError('Failed to delete emoji: This is an error') }
            ],
            setup(ctx) {
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId))
                    .resolves(DiscordPermissions.MANAGE_GUILD_EXPRESSIONS)
                    .mustHappen(1);
                features.setup((m, $) => m.deleteEmoji($({
                    guildId: ctx.guildId,
                    emojiId: '234762389364243',
                    auditReason: '@command.user'
                }))).resolves({ success: false, cause: 'This is an error' }).mustHappen(1);
            }
        },
        {
            code: '{emojidelete;234762389364243}',
            expected: '`Failed to delete emoji: And this is line 2`',
            errors: [
                { error: new BBTagRuntimeError('Failed to delete emoji: And this is line 2') }
            ],
            setup(ctx) {
                features.setup(m => m.getMemberPermissions(ctx.guildId, ctx.authorizerId))
                    .resolves(DiscordPermissions.MANAGE_GUILD_EXPRESSIONS)
                    .mustHappen(1);
                features.setup((m, $) => m.deleteEmoji($({
                    guildId: ctx.guildId,
                    emojiId: '234762389364243',
                    auditReason: '@command.user'
                }))).resolves({ success: false, cause: 'And this is line 2' }).mustHappen(1);
            }
        }
    ]
});
