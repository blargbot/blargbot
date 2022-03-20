import { guard } from '@blargbot/core/utils';
import { DiscordRESTError } from 'eris';
import fetch from 'node-fetch';

import { BBTagContext } from '../../BBTagContext';
import { DefinedSubtag } from '../../DefinedSubtag';
import { BBTagRuntimeError } from '../../errors';
import { SubtagType } from '../../utils';

export class GuildSetIconSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'guildseticon',
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: ['image'],
                    description: 'Updates the current guild\'s icon with the provided image. ' +
                        '`image` is either a link to an image, or a base64 encoded data url (`data:<content-type>;base64,<base64-data>`). You may need to use {semi} for the latter.',
                    exampleCode: '{guildseticon;https://some.cool/image.png}',
                    exampleOut: '', //TODO meaningful output
                    returns: 'nothing',
                    execute: (ctx, [image]) => this.setGuildIcon(ctx, image.value)

                }
            ]
        });
    }

    public async setGuildIcon(context: BBTagContext, image: string): Promise<void> {
        if (!context.hasPermission('manageGuild'))
            throw new BBTagRuntimeError('Author cannot modify the guild');

        if (guard.isUrl(image)) {
            const res = await fetch(image);
            const contentType = res.headers.get('content-type');
            image = `data:${contentType !== null ? contentType : ''};base64,${(await res.buffer()).toString('base64')}`;
        } else if (!image.startsWith('data:')) {
            throw new BBTagRuntimeError('Image was not a buffer or a URL');
        }

        try {
            await context.guild.edit({ icon: image }, context.auditReason());
        } catch (err: unknown) {
            if (!(err instanceof DiscordRESTError))
                throw err;

            const parts = err.message.split('\n').map(m => m.trim());
            throw new BBTagRuntimeError(`Failed to set icon: ${parts[1] ?? parts[0]}`);
        }
    }
}
