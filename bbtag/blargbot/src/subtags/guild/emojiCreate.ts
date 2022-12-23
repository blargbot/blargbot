import { BBTagRuntimeError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';
import { guard } from '@blargbot/core/utils/index.js';
import { parse } from '@blargbot/core/utils/parse/index.js';
import * as Eris from 'eris';
import fetch from 'node-fetch';

import { bbtag, SubtagType } from '../../utils/index.js';
import { p } from '../p.js';

interface EmojiCreateOptions {
    name: string;
    image: string;
    roles: string[];
}

export class EmojiCreateSubtag extends Subtag {
    public constructor() {
        super({
            name: 'emojiCreate',
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

        const image: string = parse.url(options.image);
        if (guard.isUrl(image)) {
            const res = await fetch(image);
            const contentType = res.headers.get('content-type');
            options.image = `data:${contentType ?? ''};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
        } else if (!image.startsWith('data:')) {
            throw new BBTagRuntimeError('Image was not a buffer or a URL');
        }

        //TODO would be nice to be able to provide one role without using an array like {emojicreate;name;image;role} and not {emojicreate;name;image;["role"]}
        const roleArray = await bbtag.tagArray.deserializeOrGetArray(context, rolesStr);
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
