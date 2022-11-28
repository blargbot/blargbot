import Eris from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation/index';
import { BBTagRuntimeError } from '../../errors/index';
import templates from '../../text';
import { SubtagType } from '../../utils/index';

const tag = templates.subtags.emojiDelete;

export class EmojiDeleteSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'emojiDelete',
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: ['id'], //TODO possibly an emote lookup for emote names? Would be neat, would allow not relying on the try/catch for unknown emojis too
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut, //TODO meaningful output like `true`/`false`,
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
            await context.guild.deleteEmoji(emojiId, context.auditReason());
        } catch (err: unknown) {
            if (!(err instanceof Eris.DiscordRESTError))
                throw err;

            const parts = err.message.split('\n').map(m => m.trim());
            throw new BBTagRuntimeError(`Failed to delete emoji: ${parts.length > 1 ? parts[1] : parts[0]}`);
        }
    }
}
