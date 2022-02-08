import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { discordUtil, SubtagType } from '@cluster/utils';
import { DiscordRESTError } from 'eris';

export class EmojiDeleteSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'emojidelete',
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: ['id'], //TODO possibly an emote lookup for emote names? Would be neat, would allow not relying on the try/catch for unknown emojis too
                    description: 'Deletes an emoji with the provided `id`',
                    exampleCode: '{emojidelete;11111111111111111}',
                    exampleOut: '', //TODO meaningful output like `true`/`false`,
                    returns: 'nothing',
                    execute: (ctx, [id]) => this.deleteEmoji(ctx, id.value)
                }
            ]
        });
    }

    public async deleteEmoji(context: BBTagContext, emojiId: string): Promise<void> {
        if (!context.hasPermission('manageEmojisAndStickers'))
            throw new BBTagRuntimeError('Author cannot delete emojis');

        try {
            const fullReason = discordUtil.formatAuditReason(context.user, context.scopes.local.reason);
            await context.guild.deleteEmoji(emojiId, fullReason);
        } catch (err: unknown) {
            if (!(err instanceof DiscordRESTError))
                throw err;

            const parts = err.message.split('\n').map(m => m.trim());
            throw new BBTagRuntimeError('Failed to delete emoji: ' + (parts.length > 1 ? parts[1] : parts[0]));
        }
    }
}
