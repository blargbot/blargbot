import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.prefix;

export interface GetPrefixThunk {
    (guildId: string): Promise<string | readonly string[] | undefined>;
}

export class PrefixSubtag extends CompiledSubtag {
    readonly #getPrefix: GetPrefixThunk;
    readonly #defaultPrefix: string;
    public constructor({ getPrefix, defaultPrefix }: { getPrefix: GetPrefixThunk; defaultPrefix: string; }) {
        super({
            name: 'prefix',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: ctx => this.getPrefix(ctx)
                }
            ]
        });
        this.#getPrefix = getPrefix;
        this.#defaultPrefix = defaultPrefix;
    }

    public async getPrefix(context: BBTagContext): Promise<string> {
        if (context.root.prefix !== undefined)
            return context.root.prefix;

        const result = await this.#getPrefix(context.local.message.channel.guild.id) ?? this.#defaultPrefix;
        if (Array.isArray(result))
            return result[0];
        return result;
    }
}
