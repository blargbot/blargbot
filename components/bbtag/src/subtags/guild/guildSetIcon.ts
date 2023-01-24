import { isUrl } from '@blargbot/guards';
import * as Eris from 'eris';
import fetch from 'node-fetch';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.guildSetIcon;

@Subtag.id('guildSetIcon')
@Subtag.factory()
export class GuildSetIconSubtag extends CompiledSubtag {
    public constructor() {
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
    }

    public async setGuildIcon(context: BBTagContext, image: string): Promise<void> {
        if (!context.hasPermission('manageGuild'))
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

        try {
            await context.guild.edit({ icon: image }, context.auditReason());
        } catch (err: unknown) {
            if (!(err instanceof Eris.DiscordRESTError))
                throw err;

            const parts = err.message.split('\n').map(m => m.trim());
            throw new BBTagRuntimeError(`Failed to set icon: ${parts[1] ?? parts[0]}`);
        }
    }
}
