import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { bbtagUtil, discordUtil, SubtagType } from '@cluster/utils';
import fetch from 'node-fetch';

interface EmojiCreateOptions {
    name: string;
    image: string;
    roles: string[];
}

export class EmojiCreateSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'emojicreate',
            category: SubtagType.API,
            definition: [
                {
                    parameters: ['name', 'image'],
                    description: 'Creates a emoji with the given name and image. ' +
                        '`image` is either a link to an image, or a base64 encoded data url (`data:<content-type>;base64,<base64-data>`). You may need to use {semi} for the latter.' + 'Returns the new emojis\'s ID.',
                    exampleCode: '{emojicreate;fancy_emote;https://some.cool/image.png}',
                    exampleOut: '11111111111111111',
                    execute: (ctx, args, subtag) => this.createEmoji(ctx, subtag, args[0].value, args[1].value, '')
                },
                {
                    parameters: ['name', 'image', 'roles'],
                    description: 'Creates a emoji with the given name and image. ' +
                        '`image` is either a link to an image, or a base64 encoded data url (`data:<content-type>;base64,<base64-data>`). You may need to use {semi} for the latter.' +
                        '`roles`, if provided, will restrict the emoji\'s usage to the specified roles. Must be an array of roles.' +
                        'Returns the new emojis\'s ID.',
                    exampleCode: '{emojicreate;fancy_emote;https://some.cool/image.png;["Cool gang"]}',
                    exampleOut: '11111111111111111',
                    execute: (ctx, args, subtag) => this.createEmoji(ctx, subtag, args[0].value, args[1].value, args[2].value)
                }
            ]
        });
    }

    public async createEmoji(
        context: BBTagContext,
        subtag: SubtagCall,
        name: string,
        imageStr: string,
        rolesStr: string
    ): Promise<string | void> {
        const permission = context.permissions;

        if (!permission.has('MANAGE_EMOJIS_AND_STICKERS')) {
            return this.customError('Author cannot create emojis', context, subtag);
        }

        const options: EmojiCreateOptions = {
            name,
            image: imageStr,
            roles: []
        };

        if (options.name === '') return this.customError('Name was not provided', context, subtag);

        if (/^https?:\/\//i.test(options.image)) {
            const res = await fetch(options.image);
            const contentType = res.headers.get('content-type');
            options.image = `data:${contentType !== null ? contentType : ''};base64,${(await res.buffer()).toString('base64')}`;
        } else if (!options.image.startsWith('data:')) {
            return this.customError('Image was not a buffer or a URL', context, subtag);
        }
        //TODO would be nice to be able to provide one role without using an array like {emojicreate;name;image;role} and not {emojicreate;name;image;["role"]}
        const roleArray = await bbtagUtil.tagArray.getArray(context, subtag, rolesStr);
        if (roleArray !== undefined) {
            for (const roleQuery of roleArray.v) {
                const role = await context.getRole(roleQuery?.toString() !== undefined ? roleQuery.toString() : '', {
                    quiet: true, suppress: true,
                    label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName}\``
                });
                if (role !== undefined) {
                    options.roles.push(role.id);
                }
            }
        }

        try {
            const fullReason = discordUtil.formatAuditReason(context.user, context.scope.reason !== undefined ? context.scope.reason : '');
            const emoji = await context.guild.emojis.create(options.image, options.name, { reason: fullReason, roles: options.roles });
            return emoji.id;
        } catch (err: unknown) {
            context.logger.error(err);
            if (err instanceof Error) {
                const parts = err.message.split('\n').map(m => m.trim());
                return this.customError('Failed to create emoji: ' + (parts.length > 1 ? parts[1] : parts[0]), context, subtag);
            }
        }
    }
}
