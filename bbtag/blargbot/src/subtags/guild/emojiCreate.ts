import Discord from '@blargbot/discord-types';
import { hasFlag, isUrl } from '@blargbot/guards';

import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { FetchService } from '../../services/FetchService.js';
import type { GuildService } from '../../services/GuildService.js';
import type { RoleService } from '../../services/RoleService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.emojiCreate;

interface EmojiCreateOptions {
    name: string;
    image: string;
    roles: string[];
}

@Subtag.id('emojiCreate')
@Subtag.ctorArgs('arrayTools', 'roles', 'guild', 'fetch')
export class EmojiCreateSubtag extends CompiledSubtag {
    readonly #arrayTools: BBTagArrayTools;
    readonly #roles: RoleService;
    readonly #guilds: GuildService;
    readonly #fetch: FetchService;

    public constructor(arrayTools: BBTagArrayTools, roles: RoleService, guilds: GuildService, fetch: FetchService) {
        super({
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: ['name', 'image', 'roles?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'id',
                    execute: (ctx, [name, image, roles]) => this.createEmoji(ctx, name.value, image.value, roles.value)
                }
            ]
        });

        this.#arrayTools = arrayTools;
        this.#roles = roles;
        this.#guilds = guilds;
        this.#fetch = fetch;
    }

    public async createEmoji(
        context: BBTagScript,
        name: string,
        imageStr: string,
        rolesStr: string
    ): Promise<string> {
        if (!hasFlag(context.runtime.authorizerPermissions, Discord.PermissionFlagsBits.ManageEmojisAndStickers))
            throw new BBTagRuntimeError('Author cannot create emojis');

        const options: EmojiCreateOptions = {
            name,
            image: imageStr,
            roles: []
        };

        if (options.name === '')
            throw new BBTagRuntimeError('Name was not provided');

        if (imageStr.startsWith('<') && imageStr.endsWith('>'))
            imageStr = imageStr.slice(1, -1);
        if (isUrl(imageStr)) {
            const res = await this.#fetch.send(imageStr);
            const contentType = res.headers.get('content-type');
            options.image = `data:${contentType ?? ''};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
        } else if (!imageStr.startsWith('data:')) {
            throw new BBTagRuntimeError('Image was not a buffer or a URL');
        }

        //TODO would be nice to be able to provide one role without using an array like {emojicreate;name;image;role} and not {emojicreate;name;image;["role"]}
        const roleArray = await this.#arrayTools.deserializeOrGetArray(context.runtime, rolesStr);
        if (roleArray !== undefined) {
            for (const roleQuery of roleArray.v) {
                const role = await this.#roles.querySingle(context.runtime, roleQuery?.toString() ?? '', { noLookup: true });
                if (role !== undefined) {
                    options.roles.push(role.id);
                }
            }
        }

        const result = await this.#guilds.createEmote(context.runtime, { image: options.image, name: options.name, roles: options.roles });
        if ('error' in result)
            throw new BBTagRuntimeError(`Failed to create emoji: ${result.error}`);

        return result.id?.toString() ?? '';
    }
}
