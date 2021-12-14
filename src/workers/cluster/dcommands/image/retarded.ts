import { BaseGlobalImageCommand, CommandContext } from '@cluster/command';
import { guard } from '@cluster/utils';
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
                        ? this.renderUser(ctx, text.asString, flags.u.merge().value)
                        : this.render(
                            ctx,
                            text.asString,
                            flags.i?.merge().value
                            ?? (ctx.message.attachments.length > 0
                                ? ctx.message.attachments[0].url
                                : ctx.author.avatarURL)
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
        if (!guard.isGuildCommandContext(context))
            return this.error(`I could not find the user \`${userStr}\``);

        const result = await context.queryMember({ filter: userStr });
        if (result.state !== 'SUCCESS')
            return this.error(`I could not find the user \`${userStr}\``);
        return await this.render(context, text, result.value.user.avatarURL);
    }

    public async render(context: CommandContext, text: string, url: string): Promise<ImageResult | string> {
        text = await context.util.resolveTags(context, text);
        return await this.renderImage(context, 'retarded', { text, avatar: url });
    }
}