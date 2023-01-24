import { isUrl } from '@blargbot/guards';
import * as Eris from 'eris';
import fetch from 'node-fetch';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.emojiCreate;

interface EmojiCreateOptions {
    name: string;
    image: string;
    roles: string[];
}

@Subtag.id('emojiCreate')
@Subtag.ctorArgs(Subtag.arrayTools())
export class EmojiCreateSubtag extends CompiledSubtag {
    readonly #arrayTools: BBTagArrayTools;

    public constructor(arrayTools: BBTagArrayTools) {
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
    }

    public async createEmoji(
        context: BBTagContext,
        name: string,
        imageStr: string,
        rolesStr: string
    ): Promise<string> {
        if (!context.hasPermission('manageEmojisAndStickers'))
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
                const role = await context.queryRole(roleQuery?.toString() ?? '', { noLookup: true });
                if (role !== undefined) {
                    options.roles.push(role.id);
                }
            }
        }

        try {
            const emoji = await context.guild.createEmoji({ image: options.image, name: options.name, roles: options.roles }, context.auditReason());
            return emoji.id;
        } catch (err: unknown) {
            if (!(err instanceof Eris.DiscordRESTError))
                throw err;

            const parts = err.message.split('\n').map(m => m.trim());
            throw new BBTagRuntimeError(`Failed to create emoji: ${parts[1] ?? parts[0]}`);
        }
    }
}
