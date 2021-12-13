import { BBTagContext, Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { discordUtil, SubtagType } from '@cluster/utils';
import fetch from 'node-fetch';

export class GuildSetIconSubtag extends Subtag {
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
        const permission = context.permissions;

        if (!permission.has('manageGuild')) {
            throw new BBTagRuntimeError('Author cannot modify the guild');
        }

        if (/^https?:\/\//i.test(image)) {
            const res = await fetch(image);
            const contentType = res.headers.get('content-type');
            image = `data:${contentType !== null ? contentType : ''};base64,${(await res.buffer()).toString('base64')}`;
        } else if (!image.startsWith('data:')) {
            throw new BBTagRuntimeError('Imaeg was not a buffer or a URL');
        }

        try {
            const fullReason = discordUtil.formatAuditReason(context.user, context.scopes.local.reason);
            await context.guild.edit({
                icon: image
            }, fullReason);
        } catch (err: unknown) {
            context.logger.error(err);
            if (err instanceof Error) {
                const parts = err.message.split('\n').map(m => m.trim());
                throw new BBTagRuntimeError('Failed to set icon: ' + (parts.length > 1 ? parts[1] : parts[0]));
            }
        }
    }
}
