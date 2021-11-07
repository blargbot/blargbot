import { BaseSubtag } from '@cluster/bbtag';
import { discordUtil, SubtagType } from '@cluster/utils';
import fetch from 'node-fetch';

export class GuildSetIconSubtag extends BaseSubtag {
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
                    execute: async (context, [{ value: image }], subtag): Promise<string | void> => {
                        const permission = context.permissions;

                        if (!permission.has('MANAGE_GUILD')) {
                            return this.customError('Author cannot modify the guild', context, subtag);
                        }

                        if (/^https?:\/\//i.test(image)) {
                            const res = await fetch(image);
                            const contentType = res.headers.get('content-type');
                            image = `data:${contentType !== null ? contentType : ''};base64,${(await res.buffer()).toString('base64')}`;
                        } else if (!image.startsWith('data:')) {
                            return this.customError('Imaeg was not a buffer or a URL', context, subtag);
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
                                return this.customError('Failed to set icon: ' + (parts.length > 1 ? parts[1] : parts[0]), context, subtag);
                            }
                        }
                    }

                }
            ]
        });
    }
}
