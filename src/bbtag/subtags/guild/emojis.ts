import type Emote from '@blargbot/discord-emote';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { RoleIdSubtag } from '../role/roleId.js';

const tag = templates.subtags.emojis;

export interface ListEmojisFeature {
    listEmojis(guildId: string, roleId?: string): Promise<readonly Emote[] | undefined>;
}

type Features = ListEmojisFeature;
//TODO IMO this should return an array of emoji IDs instead of an array of emojis
export class EmojisSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'emojis',
            category: SubtagType.GUILD,
            description: tag.description,
            definition: [
                {
                    parameters: [],
                    description: tag.all.description,
                    exampleCode: tag.all.exampleCode,
                    exampleOut: tag.all.exampleOut,
                    returns: 'string[]',
                    execute: (context) => this.getAllEmojis(context)
                },
                {
                    parameters: ['role'],
                    description: tag.forRole.description,
                    exampleCode: tag.forRole.exampleCode,
                    exampleOut: tag.forRole.exampleOut,
                    returns: 'string[]',
                    execute: (ctx, [role]) => this.getEmojisForRole(ctx, role.value)
                }
            ]
        });
        this.#features = features;
    }

    public async getAllEmojis(context: BBTagContext): Promise<readonly string[]> {
        const emojis = await this.#features.listEmojis(context.root.guildId);
        return emojis?.map(x => x.toString()) ?? [];
    }

    public async getEmojisForRole(context: BBTagContext, roleStr: string): Promise<string[]> {
        const roleId = await RoleIdSubtag.query(context, roleStr, { noErrors: true, noLookup: true }) ?? roleStr;

        // if (role === undefined)
        //     throw new RoleNotFoundError(roleStr) //TODO add this to other role subtags too, but when versioning is a thing to avoid incompatibilities

        const emojis = await this.#features.listEmojis(context.root.guildId, roleId);
        return emojis?.map(x => x.toString()) ?? [];
    }
}
