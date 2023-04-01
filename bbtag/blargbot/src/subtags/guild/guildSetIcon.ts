import Discord from '@blargbot/discord-types';
import { hasFlag, isUrl } from '@blargbot/guards';

import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import type { FetchService } from '../../services/FetchService.js';
import type { GuildService } from '../../services/GuildService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.guildSetIcon;

@Subtag.id('guildSetIcon')
@Subtag.ctorArgs('guild', 'fetch')
export class GuildSetIconSubtag extends CompiledSubtag {
    readonly #guilds: GuildService;
    readonly #fetch: FetchService;

    public constructor(guilds: GuildService, fetch: FetchService) {
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
        this.#fetch = fetch;
    }

    public async setGuildIcon(context: BBTagScript, image: string): Promise<void> {
        if (!hasFlag(context.runtime.authorizerPermissions, Discord.PermissionFlagsBits.ManageGuild))
            throw new BBTagRuntimeError('Author cannot modify the guild');

        if (image.startsWith('<') && image.endsWith('>'))
            image = image.slice(1, -1);
        if (isUrl(image)) {
            const res = await this.#fetch.send(image);
            const contentType = res.headers.get('content-type');
            image = `data:${contentType !== null ? contentType : ''};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
        } else if (!image.startsWith('data:')) {
            throw new BBTagRuntimeError('Image was not a buffer or a URL');
        }

        const result = await this.#guilds.edit(context.runtime, { icon: image });
        if (result !== undefined)
            throw new BBTagRuntimeError(`Failed to set icon: ${result.error}`);
    }
}
