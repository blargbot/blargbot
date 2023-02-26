import { hasFlag, isUrl } from '@blargbot/guards';
import Discord from '@blargbot/discord-types';
import fetch from 'node-fetch';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import type { GuildService } from '../../services/GuildService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.guildSetIcon;

@Subtag.names('guildSetIcon')
@Subtag.ctorArgs(Subtag.service('guild'))
export class GuildSetIconSubtag extends CompiledSubtag {
    readonly #guilds: GuildService;

    public constructor(guilds: GuildService) {
        super({
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: ['image'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut, //TODO meaningful output
                    returns: 'nothing',
                    execute: (ctx, [image]) => this.setGuildIcon(ctx, image.value)

                }
            ]
        });

        this.#guilds = guilds;
    }

    public async setGuildIcon(context: BBTagContext, image: string): Promise<void> {
        const permission = context.getPermission(context.authorizer);
        if (!hasFlag(permission, Discord.PermissionFlagsBits.ManageGuild))
            throw new BBTagRuntimeError('Author cannot modify the guild');

        if (image.startsWith('<') && image.endsWith('>'))
            image = image.slice(1, -1);
        if (isUrl(image)) {
            const res = await fetch(image);
            const contentType = res.headers.get('content-type');
            image = `data:${contentType !== null ? contentType : ''};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
        } else if (!image.startsWith('data:')) {
            throw new BBTagRuntimeError('Image was not a buffer or a URL');
        }

        const result = await this.#guilds.edit(context, { icon: image });
        if (result !== undefined)
            throw new BBTagRuntimeError(`Failed to set icon: ${result.error}`);
    }
}
