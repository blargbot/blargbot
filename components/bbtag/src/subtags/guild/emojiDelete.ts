import { hasFlag } from '@blargbot/guards';
import * as Discord from 'discord-api-types/v10';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import type { GuildService } from '../../services/GuildService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.emojiDelete;

@Subtag.names('emojiDelete')
@Subtag.ctorArgs(Subtag.service('guild'))
export class EmojiDeleteSubtag extends CompiledSubtag {
    readonly #guilds: GuildService;

    public constructor(guilds: GuildService) {
        super({
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

        this.#guilds = guilds;
    }

    public async deleteEmoji(context: BBTagContext, emojiId: string): Promise<void> {
        const permission = context.getPermission(context.authorizer);
        if (!hasFlag(permission, Discord.PermissionFlagsBits.ManageEmojisAndStickers))
            throw new BBTagRuntimeError('Author cannot delete emojis');

        const result = await this.#guilds.deleteEmote(context, emojiId);
        if (result !== undefined)
            throw new BBTagRuntimeError(`Failed to delete emoji: ${result.error}`);
    }
}
