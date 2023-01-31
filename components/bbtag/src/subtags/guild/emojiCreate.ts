import { hasFlag, isUrl } from '@blargbot/guards';
import * as Discord from 'discord-api-types/v10';
import fetch from 'node-fetch';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
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

@Subtag.names('emojiCreate')
@Subtag.ctorArgs(Subtag.arrayTools(), Subtag.service('role'), Subtag.service('guild'))
export class EmojiCreateSubtag extends CompiledSubtag {
    readonly #arrayTools: BBTagArrayTools;
    readonly #roles: RoleService;
    readonly #guilds: GuildService;

    public constructor(arrayTools: BBTagArrayTools, roles: RoleService, guilds: GuildService) {
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
    }

    public async createEmoji(
        context: BBTagContext,
        name: string,
        imageStr: string,
        rolesStr: string
    ): Promise<string> {
        const permission = context.getPermission(context.authorizer);
        if (!hasFlag(permission, Discord.PermissionFlagsBits.ManageEmojisAndStickers))
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
            const res = await fetch(imageStr);
            const contentType = res.headers.get('content-type');
            options.image = `data:${contentType ?? ''};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
        } else if (!imageStr.startsWith('data:')) {
            throw new BBTagRuntimeError('Image was not a buffer or a URL');
        }

        //TODO would be nice to be able to provide one role without using an array like {emojicreate;name;image;role} and not {emojicreate;name;image;["role"]}
        const roleArray = await this.#arrayTools.deserializeOrGetArray(context, rolesStr);
        if (roleArray !== undefined) {
            for (const roleQuery of roleArray.v) {
                const role = await this.#roles.querySingle(context, roleQuery?.toString() ?? '', { noLookup: true });
                if (role !== undefined) {
                    options.roles.push(role.id);
                }
            }
        }

        const result = await this.#guilds.createEmote(context, { image: options.image, name: options.name, roles: options.roles });
        if ('error' in result)
            throw new BBTagRuntimeError(`Failed to create emoji: ${result.error}`);

        return result.id?.toString() ?? '';
    }
}