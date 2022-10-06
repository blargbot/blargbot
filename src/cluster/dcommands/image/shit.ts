import { CommandContext, GlobalImageCommand } from '@blargbot/cluster/command';
import { ImageResult } from '@blargbot/image/types';

export class ShitCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: `shit`,
            aliases: [`heck`],
            definitions: [
                {
                    parameters: `{text+=Your favourite anime}`,
                    description: `Tells everyone what's shit.`,
                    execute: (ctx, [text], flags) => this.render(ctx, text.asString, flags.p !== undefined)
                }
            ],
            flags: [
                { flag: `p`, word: `plural`, description: `Whether or not the text is plural (use ARE instead of IS).` }
            ]
        });
    }

    public async render(context: CommandContext, text: string, plural: boolean): Promise<ImageResult | string> {
        text = await context.util.resolveTags(context, text);
        return await this.renderImage(context, `shit`, { text, plural });
    }
}
