import { CommandType } from '@cluster/utils';
import { MessageOptions, User } from 'discord.js';
import Wolke from 'wolken';

import { BaseGlobalCommand } from './BaseGlobalCommand';
import { CommandContext } from './CommandContext';

export abstract class BaseSocialWolkeCommand extends BaseGlobalCommand {
    private readonly client: Wolke;

    public constructor(
        name: string,
        type: string,
        action: string | undefined,
        target: 'self' | 'user' | 'none',
        description: string,
        wolkeKey: string
    ) {
        super({
            name: name,
            category: CommandType.SOCIAL,
            definitions: [
                target !== 'self' ? target === 'none' ? {
                    parameters: '',
                    description,
                    execute: (ctx) => this.render(ctx, type, undefined, undefined)
                } : {
                    parameters: '{user:user+?}',
                    description,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    execute: (ctx, [user]) => this.render(ctx, type, action, user ?? ctx.author)
                } : {
                    parameters: '',
                    description,
                    execute: (ctx) => this.render(ctx, type, action, undefined)
                }
            ]
        });

        this.client = new Wolke(wolkeKey, 'Wolke', 'blargbot/6.0.0');
    }

    public async render(context: CommandContext, type: string, action: string | undefined, target: User | undefined): Promise<MessageOptions> {
        const image = await this.client.getRandom({ type, allowNSFW: false, filetype: 'gif' });
        const message = action !== undefined ? target === undefined
            ? `**${context.author.toString()}** ${action}!`
            : `**${context.author.toString()}** ${action} **${target.id === context.author.id ? 'themself' : target.toString()}**!`
            : undefined;

        return {
            embeds: [
                {
                    description: message,
                    image: { url: image.url },
                    footer: { text: 'Powered by weeb.sh' }
                }
            ]
        };
    }
}
