import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { ReasonSubtag } from '../bot/reason.js';
import type { ApiResult, GetMemberPermissionsFeature } from '../types.js';

const tag = templates.subtags.emojiDelete;

export type DeleteEmojiResult = ApiResult<null, { cause: string; }>

export interface DeleteEmojiOptions {
    readonly guildId: string;
    readonly emojiId: string;
    readonly auditReason: string;
}

export interface DeleteEmojiFeature {
    deleteEmoji(options: DeleteEmojiOptions): Promise<DeleteEmojiResult>;
}

type Features = DeleteEmojiFeature & GetMemberPermissionsFeature;
export class EmojiDeleteSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
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
        this.#features = features;
    }

    public async deleteEmoji(context: BBTagContext, emojiId: string): Promise<void> {
        const permissions = await this.#features.getMemberPermissions(context.root.guildId, context.root.authorizerId);
        if (!permissions.hasAny('ADMINISTRATOR', 'MANAGE_GUILD_EXPRESSIONS'))
            throw new BBTagRuntimeError('Author cannot delete emojis');

        const result = await this.#features.deleteEmoji({
            guildId: context.root.guildId,
            emojiId,
            auditReason: await ReasonSubtag.get(context)
        });

        if (result.success)
            return;

        throw new BBTagRuntimeError(`Failed to delete emoji: ${result.cause}`, result.reason);
    }
}
