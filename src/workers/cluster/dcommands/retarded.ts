import { BaseGlobalImageCommand, CommandContext } from '@cluster/command';
import { ImageResult } from '@image/types';

export class RetardedCommand extends BaseGlobalImageCommand {
    public constructor() {
        super({
            name: 'retarded',
            definitions: [
                {
                    parameters: '{text+}',
                    description: 'Tells everyone who is retarded.',
                    execute: (ctx, [text], flags) => flags.u !== undefined
                        ? this.renderUser(ctx, text, flags.u.merge().value)
                        : this.render(
                            ctx,
                            text,
                            flags.i?.merge().value
                            ?? ctx.message.attachments.first()?.url
                            ?? ctx.author.displayAvatarURL({ dynamic: true, format: 'png', size: 512 })
                        )
                }
            ],
            flags: [
                { flag: 'u', word: 'user', description: 'The person who is retarded.' },
                { flag: 'i', word: 'image', description: 'A custom image.' }
            ]
        });
    }

    public async renderUser(context: CommandContext, text: string, userStr: string): Promise<ImageResult | string> {
        const user = await context.util.getUser(context, userStr);
        if (user === undefined)
            return this.error(`I could not find the user \`${userStr}\``);

        return await this.render(context, text, user.displayAvatarURL({ dynamic: true, format: 'png', size: 512 }));
    }

    public async render(context: CommandContext, text: string, url: string): Promise<ImageResult | string> {
        text = await context.util.resolveTags(context, text);
        return await this.renderImage(context, 'retarded', { text, avatar: url });
    }
}
