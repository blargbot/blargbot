import { BaseSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { discordUtil, SubtagType } from '@cluster/utils';

export class EmojiDeleteSubtag extends BaseSubtag {
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
                    execute: async (context, [{ value: id }]): Promise<string | void> => {
                        const permission = context.permissions;

                        if (!permission.has('MANAGE_EMOJIS_AND_STICKERS')) {
                            throw new BBTagRuntimeError('Author cannot delete emojis');
                        }

                        try {
                            const fullReason = discordUtil.formatAuditReason(context.user, context.scopes.local.reason);
                            await context.guild.emojis.cache.get(id)?.delete(fullReason);
                        } catch (err: unknown) {
                            context.logger.error(err);
                            if (err instanceof Error) {
                                const parts = err.message.split('\n').map(m => m.trim());
                                throw new BBTagRuntimeError('Failed to delete emoji: ' + (parts.length > 1 ? parts[1] : parts[0]));
                            }
                        }
                    }
                }
            ]
        });
    }
}
